import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue-sonner';
import { humanizeErrorMessage, parseApiErrorMessage, showErrorToast } from '@/lib/error-message';
import { padQueueNumber } from '@/lib/format';
import { jsonRequestHeaders } from '@/lib/jsonRequest';
import {
    createScanHistoryEntry,
    extractQrCandidate,
    isGlobalScanFeedPayload,
    parseGlobalScanCursor,
    parseGlobalScanFeedRows,
    playScanBeep,
    type TIGlobalScanFeedRow,
    type TIScanEntry,
    type TIScanResult,
} from '@/lib/qrScanUi';

/** Kunci sessionStorage agar id meja kasir stabil selama satu sesi tab. */
const DESK_STORAGE_KEY = 'scan-desk-id';

/** Jeda anti-ganda: hasil yang sama dalam 2000 ms dianggap pantulan kamera. */
const SCAN_COOLDOWN_MS = 2000;

/** Selang polling umpan pantau global antar meja kasir. */
const FEED_POLL_MS = 2000;

/** Batas tunggu tiap permintaan polling agar tab macet tidak menumpuk. */
const FEED_POLL_TIMEOUT_MS = 8000;

export type TQrScanSource = 'camera' | 'manual';

export interface IQrFeedArgs {
    storeUrl: string;
    feedUrl: string;
}

export interface ISubmitScanArgs {
    raw: string;
    source: TQrScanSource;
}

export interface IQrFeedControls {
    deskId: string;
    scanResult: Ref<TIScanResult | null>;
    scanHistory: Ref<TIScanEntry[]>;
    scanBusy: Ref<boolean>;
    acceptScanInput: (raw: string) => boolean;
    submitScan: (args: ISubmitScanArgs) => Promise<void>;
    isTodayEntry: (entry: TIScanEntry) => boolean;
    toScanResult: (entry: TIScanEntry) => TIScanResult;
    clearHistory: () => void;
}

interface IGlobalScanAttendee {
    name?: string;
    email?: string;
    registration_number?: string;
    application_id?: string;
    queue_number?: number | null;
    form_answer_id?: string;
}

interface IGlobalScanEnvelope {
    type: 'event' | 'recruitment';
    eventTitle: string;
    attendee: IGlobalScanAttendee;
    status: 'success' | 'duplicate';
    scannedAt: string;
}

interface IGlobalScanErrorBody {
    message?: string;
    type?: string;
    eventTitle?: string;
    attendee?: IGlobalScanAttendee;
    errors?: Record<string, string[]>;
}

/** True bila body error scan berupa objek JSON (batas eksternal `error.response.data`). */
function isGlobalScanErrorBody(value: unknown): value is IGlobalScanErrorBody {
    return typeof value === 'object' && value !== null;
}

function resolveDeskId(): string {
    try {
        const existing = sessionStorage.getItem(DESK_STORAGE_KEY);
        if (existing !== null && existing.trim().length > 0) {
            return existing;
        }

        const fresh =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID().slice(0, 8)
                : Math.random().toString(16).slice(2, 10);
        sessionStorage.setItem(DESK_STORAGE_KEY, fresh);

        return fresh;
    } catch {
        return Math.random().toString(16).slice(2, 10);
    }
}

function formatGlobalEventTitle(kind: 'event' | 'oprec', rawTitle: string): string {
    const title = rawTitle.trim();
    if (title.length === 0) {
        return '-';
    }

    if (kind !== 'oprec') {
        return title;
    }

    return title.replace(/(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}(?::\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?/g, '$1');
}

function formatFeedTime(ts: string): string {
    const parsed = new Date(ts);
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    return parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function scanIdentity(
    kind: 'event' | 'oprec',
    identifier: string,
    queueNumber: number | null,
    eventTitle: string
): string {
    return `${kind}|${eventTitle}|${identifier}|${queueNumber === null ? '-' : String(queueNumber)}`;
}

/** Kelola pengiriman hasil scan, riwayat, dan identitas meja kasir. */
export function useQrFeed(args: IQrFeedArgs): IQrFeedControls {
    const deskId = resolveDeskId();

    const scanResult = ref<TIScanResult | null>(null);
    const scanHistory = ref<TIScanEntry[]>([]);
    const lastRaw = ref('');
    const lastAt = ref(0);
    const scanBusy = ref(false);

    const scanEntryEpochMs = new Map<string, number>();
    const rawCodeByEntryId = new Map<string, string>();
    const localEntryIdentities = new Set<string>();
    const seenFeedIds = new Set<string>();
    let feedCursor = '';
    let pollTimer: number | null = null;
    let pollAbort: AbortController | null = null;

    function isTodayEntry(entry: TIScanEntry): boolean {
        const epoch: number | undefined = scanEntryEpochMs.get(entry.id);
        if (epoch === undefined) {
            return true;
        }

        return new Date(epoch).toDateString() === new Date().toDateString();
    }

    function toScanResult(entry: TIScanEntry): TIScanResult {
        return {
            name: entry.name,
            email: entry.email,
            status: entry.status,
            source: entry.source,
            rawCode: rawCodeByEntryId.get(entry.id) ?? entry.email,
            eventKind: entry.eventKind,
            eventTitle: entry.eventTitle,
            queueNumber: entry.queueNumber,
        };
    }

    function mapEnvelopeKind(type: string | undefined): 'event' | 'oprec' {
        return type === 'recruitment' ? 'oprec' : 'event';
    }

    function pushResult(result: TIScanResult): void {
        localEntryIdentities.add(scanIdentity(result.eventKind, result.email, result.queueNumber, result.eventTitle));
        scanResult.value = result;
        const entry: TIScanEntry = createScanHistoryEntry(result);
        scanEntryEpochMs.set(entry.id, Date.now());
        rawCodeByEntryId.set(entry.id, result.rawCode);
        scanHistory.value.unshift(entry);
        playScanBeep(result.status);
    }

    function acceptScanInput(raw: string): boolean {
        const now = Date.now();
        const key = raw.trim();
        if (key.length > 0 && key === lastRaw.value && now - lastAt.value < SCAN_COOLDOWN_MS) {
            return false;
        }

        lastRaw.value = key;
        lastAt.value = now;

        return true;
    }

    async function submitScan(scanArgs: ISubmitScanArgs): Promise<void> {
        const { raw, source } = scanArgs;
        if (scanBusy.value) {
            return;
        }

        const trimmed = raw.trim();
        if (trimmed.length === 0) {
            showErrorToast('Isi kode registrasi terlebih dahulu.');

            return;
        }

        scanBusy.value = true;
        const rawDisplay = extractQrCandidate(trimmed);

        try {
            const { data } = await axios.post<IGlobalScanEnvelope>(
                args.storeUrl,
                { raw: trimmed, desk: deskId },
                { headers: jsonRequestHeaders() }
            );

            const kind = mapEnvelopeKind(data.type);
            const title = formatGlobalEventTitle(kind, data.eventTitle ?? '');

            let result: TIScanResult;

            if (kind === 'oprec') {
                const identifier = data.attendee.registration_number?.trim() || '-';
                const queueNumber = data.attendee.queue_number ?? null;
                result = {
                    name: data.attendee.name?.trim() || 'Tanpa nama',
                    email: identifier,
                    status: 'success',
                    source,
                    rawCode: rawDisplay,
                    eventKind: kind,
                    eventTitle: title,
                    queueNumber,
                };
                toast.success(data.attendee.name?.trim() || 'Check-in berhasil.', {
                    description: `#${padQueueNumber(queueNumber)} — arahkan ke ruang tunggu`,
                });
            } else {
                const email = data.attendee.email?.trim() || '-';
                result = {
                    name: data.attendee.name?.trim() || 'Tanpa nama',
                    email,
                    status: 'success',
                    source,
                    rawCode: rawDisplay,
                    eventKind: kind,
                    eventTitle: title,
                    queueNumber: null,
                };
                toast.success(data.attendee.name?.trim() || 'Check-in berhasil.', {
                    description: 'Boleh masuk — tiket dikirim ke email',
                });
            }

            pushResult(result);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                // Body error (batas eksternal `error.response.data`); `unknown` disempitkan predikat objek.
                const rawBody: unknown = error.response?.data;
                const body = isGlobalScanErrorBody(rawBody) ? rawBody : undefined;

                if (status === 409) {
                    const kind = mapEnvelopeKind(body?.type);
                    const title = formatGlobalEventTitle(kind, body?.eventTitle ?? '');
                    const fallbackQueue = scanResult.value?.eventKind === kind ? scanResult.value.queueNumber : null;
                    const msg = humanizeErrorMessage(body?.message ?? 'Peserta sudah pernah scan.');

                    if (kind === 'oprec') {
                        const identifier = body?.attendee?.registration_number?.trim() || '-';
                        const name = body?.attendee?.name?.trim() || 'Sudah terdaftar hadir';
                        pushResult({
                            name,
                            email: identifier,
                            status: 'already',
                            source,
                            rawCode: rawDisplay,
                            eventKind: kind,
                            eventTitle: title,
                            queueNumber: body?.attendee?.queue_number ?? fallbackQueue,
                        });
                        toast.warning(msg, {
                            description: `${name} · ${identifier}`,
                        });
                    } else {
                        const email = body?.attendee?.email?.trim() || '-';
                        const name = body?.attendee?.name?.trim() || 'Sudah terdaftar hadir';
                        pushResult({
                            name,
                            email,
                            status: 'already',
                            source,
                            rawCode: rawDisplay,
                            eventKind: kind,
                            eventTitle: title,
                            queueNumber: null,
                        });
                        toast.warning(msg, {
                            description: email !== '-' ? `${name} · ${email}` : name,
                        });
                    }

                    return;
                }

                if (status === 422) {
                    const msg = parseApiErrorMessage(body, 'Data tidak valid.');
                    pushResult({
                        name: 'Tidak dapat diproses',
                        email: '-',
                        status: 'invalid',
                        source,
                        rawCode: rawDisplay,
                        eventKind: scanResult.value?.eventKind ?? 'event',
                        eventTitle: scanResult.value?.eventTitle ?? '-',
                        queueNumber: null,
                    });
                    showErrorToast(msg);

                    return;
                }

                if (status === 429) {
                    pushResult({
                        name: 'Terlalu banyak scan',
                        email: '-',
                        status: 'invalid',
                        source,
                        rawCode: rawDisplay,
                        eventKind: scanResult.value?.eventKind ?? 'event',
                        eventTitle: scanResult.value?.eventTitle ?? '-',
                        queueNumber: null,
                    });
                    showErrorToast('Terlalu banyak scan', {
                        description: 'Tunggu sebentar sebelum memindai lagi.',
                    });

                    return;
                }
            }

            pushResult({
                name: 'Kesalahan jaringan',
                email: '-',
                status: 'invalid',
                source,
                rawCode: rawDisplay,
                eventKind: scanResult.value?.eventKind ?? 'event',
                eventTitle: scanResult.value?.eventTitle ?? '-',
                queueNumber: null,
            });
            showErrorToast('Permintaan gagal', {
                description:
                    error instanceof Error ? humanizeErrorMessage(error.message) : 'Coba lagi dalam beberapa saat.',
            });
        } finally {
            scanBusy.value = false;
        }
    }

    function clearHistory(): void {
        scanHistory.value = [];
        scanEntryEpochMs.clear();
        rawCodeByEntryId.clear();
        scanResult.value = null;
        toast('Riwayat scan dibersihkan');
    }

    function ingestFeedRow(row: TIGlobalScanFeedRow): void {
        if (seenFeedIds.has(row.id)) {
            return;
        }
        seenFeedIds.add(row.id);

        const kind: 'event' | 'oprec' = row.type === 'recruitment' ? 'oprec' : 'event';
        const name = row.name.trim().length > 0 ? row.name.trim() : 'Tanpa nama';
        const identifier = row.identifier.trim().length > 0 ? row.identifier.trim() : '-';
        const eventTitle = formatGlobalEventTitle(kind, row.eventTitle);

        if (localEntryIdentities.has(scanIdentity(kind, identifier, row.queueNumber, eventTitle))) {
            return;
        }

        const parsed = new Date(row.ts);
        const epoch = Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();

        const entry: TIScanEntry = {
            id: row.id,
            name,
            email: identifier,
            time: formatFeedTime(row.ts),
            status: 'success',
            source: 'camera',
            eventKind: kind,
            eventTitle,
            queueNumber: row.queueNumber,
        };
        scanEntryEpochMs.set(entry.id, epoch);
        rawCodeByEntryId.set(entry.id, identifier);
        scanHistory.value.unshift(entry);
    }

    /**
     * Terapkan payload feed eksternal. Parameter `unknown` di sini posisi penyempitan:
     * payload divalidasi predikat `isGlobalScanFeedPayload` sebelum diparse.
     */
    function applyFeed(payload: unknown): void {
        if (!isGlobalScanFeedPayload(payload)) {
            return;
        }

        const cursor = parseGlobalScanCursor(payload);
        if (cursor.length > 0) {
            feedCursor = cursor;
        }

        for (const row of parseGlobalScanFeedRows(payload)) {
            ingestFeedRow(row);
        }
    }

    async function pollFeed(): Promise<void> {
        if (pollAbort !== null) {
            return;
        }

        const controller = new AbortController();
        pollAbort = controller;

        try {
            // Respons feed mentah sengaja `unknown`: langsung divalidasi predikat isGlobalScanFeedPayload di applyFeed.
            const { data } = await axios.get<unknown>(args.feedUrl, {
                params: feedCursor.length > 0 ? { since: feedCursor } : {},
                headers: jsonRequestHeaders(),
                signal: controller.signal,
                timeout: FEED_POLL_TIMEOUT_MS,
            });

            applyFeed(data);
        } catch {
            // Feed gagal sesaat bukan alasan menghentikan polling; interval berikutnya mencoba lagi.
        } finally {
            pollAbort = null;
        }
    }

    function startFeedPolling(): void {
        if (pollTimer !== null) {
            return;
        }

        void pollFeed();
        pollTimer = window.setInterval(() => {
            void pollFeed();
        }, FEED_POLL_MS);
    }

    function stopFeedPolling(): void {
        if (pollTimer !== null) {
            window.clearInterval(pollTimer);
            pollTimer = null;
        }

        if (pollAbort !== null) {
            pollAbort.abort();
            pollAbort = null;
        }
    }

    onMounted(startFeedPolling);
    onBeforeUnmount(stopFeedPolling);

    return {
        deskId,
        scanResult,
        scanHistory,
        scanBusy,
        acceptScanInput,
        submitScan,
        isTodayEntry,
        toScanResult,
        clearHistory,
    };
}
