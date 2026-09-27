import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { toast } from 'vue-sonner';
import { humanizeErrorMessage, parseApiErrorMessage } from '@/lib/errorMessage';
import { useErrorToast } from './useErrorToast';
import { padQueueNumber } from '@/lib/format';
import { jsonRequestHeaders } from '@/lib/jsonRequest';
import {
    createScanHistoryEntry,
    extractQrCandidate,
    isGlobalScanFeedPayload,
    parseGlobalScanCursor,
    parseGlobalScanFeedRows,
    type TIGlobalScanFeedRow,
    type TIScanEntry,
    type TIScanResult,
} from '@/lib/qrScanUi';
import { useScanFeedback } from '@/hooks/useScanFeedback';

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

/** Konteks sumber scan (sumber input + kode mentah yang tampil) untuk merakit hasil. */
interface IScanResultContext {
    source: TQrScanSource;
    rawCode: string;
}

/** Konteks penyusunan hasil gagal non-duplikat (nama sebab + event terakhir). */
interface IInvalidScanContext extends IScanResultContext {
    name: string;
    eventKind: 'event' | 'oprec';
    eventTitle: string;
}

/** Konteks penyusunan hasil duplikat termasuk nomor antrean cadangan dari hasil terakhir. */
interface IDuplicateScanContext extends IScanResultContext {
    fallbackQueue: number | null;
}

/** Hasil duplikat 409: entri riwayat + deskripsi toast peringatan. */
interface IDuplicateScanOutcome {
    result: TIScanResult;
    warningDescription: string;
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

/** Petakan tipe envelope server ke jenis event internal. */
function mapEnvelopeKind(type: string | undefined): 'event' | 'oprec' {
    return type === 'recruitment' ? 'oprec' : 'event';
}

/** Rakit hasil scan sukses dari envelope check-in (cabang event & oprec). */
function buildCheckInResult(data: IGlobalScanEnvelope, context: IScanResultContext): TIScanResult {
    const kind = mapEnvelopeKind(data.type);
    const eventTitle = formatGlobalEventTitle(kind, data.eventTitle ?? '');
    const name = data.attendee.name?.trim() || 'Tanpa nama';

    if (kind === 'oprec') {
        return {
            name,
            email: data.attendee.registration_number?.trim() || '-',
            status: 'success',
            source: context.source,
            rawCode: context.rawCode,
            eventKind: kind,
            eventTitle,
            queueNumber: data.attendee.queue_number ?? null,
        };
    }

    return {
        name,
        email: data.attendee.email?.trim() || '-',
        status: 'success',
        source: context.source,
        rawCode: context.rawCode,
        eventKind: kind,
        eventTitle,
        queueNumber: null,
    };
}

/** Tampilkan toast sukses check-in; cabang oprec memuat nomor antrean ter-pad. */
function showCheckInSuccessToast(data: IGlobalScanEnvelope, result: TIScanResult): void {
    toast.success(data.attendee.name?.trim() || 'Check-in berhasil.', {
        description:
            result.eventKind === 'oprec'
                ? `#${padQueueNumber(result.queueNumber)} — arahkan ke ruang tunggu`
                : 'Boleh masuk — tiket dikirim ke email',
    });
}

/** Rakit hasil scan duplikat (409) beserta deskripsi toast per cabang event/oprec. */
function buildDuplicateScan(
    body: IGlobalScanErrorBody | undefined,
    context: IDuplicateScanContext
): IDuplicateScanOutcome {
    const kind = mapEnvelopeKind(body?.type);
    const eventTitle = formatGlobalEventTitle(kind, body?.eventTitle ?? '');
    const name = body?.attendee?.name?.trim() || 'Sudah terdaftar hadir';

    if (kind === 'oprec') {
        const identifier = body?.attendee?.registration_number?.trim() || '-';
        return {
            result: {
                name,
                email: identifier,
                status: 'already',
                source: context.source,
                rawCode: context.rawCode,
                eventKind: kind,
                eventTitle,
                queueNumber: body?.attendee?.queue_number ?? context.fallbackQueue,
            },
            warningDescription: `${name} · ${identifier}`,
        };
    }

    const email = body?.attendee?.email?.trim() || '-';
    return {
        result: {
            name,
            email,
            status: 'already',
            source: context.source,
            rawCode: context.rawCode,
            eventKind: kind,
            eventTitle,
            queueNumber: null,
        },
        warningDescription: email !== '-' ? `${name} · ${email}` : name,
    };
}

/** Rakit hasil scan gagal (status `invalid`) dari nama sebab dan konteks event terakhir. */
function buildInvalidScanResult(context: IInvalidScanContext): TIScanResult {
    return {
        name: context.name,
        email: '-',
        status: 'invalid',
        source: context.source,
        rawCode: context.rawCode,
        eventKind: context.eventKind,
        eventTitle: context.eventTitle,
        queueNumber: null,
    };
}

/** Baca body error scan dari kegagalan axios; `undefined` bila bukan objek JSON. */
function readScanErrorBody(error: AxiosError): IGlobalScanErrorBody | undefined {
    const rawBody: unknown = error.response?.data;
    return isGlobalScanErrorBody(rawBody) ? rawBody : undefined;
}

/** Kelola pengiriman hasil scan, riwayat, dan identitas meja kasir. */
export function useQrFeed(args: IQrFeedArgs): IQrFeedControls {
    const { showErrorToast } = useErrorToast();
    const deskId = resolveDeskId();
    const { playScanBeep } = useScanFeedback();

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

    /** Catat hasil duplikat 409 lalu tampilkan peringatan (push riwayat dulu, toast kemudian). */
    function handleDuplicateScan(body: IGlobalScanErrorBody | undefined, context: IScanResultContext): void {
        const fallbackQueue =
            scanResult.value?.eventKind === mapEnvelopeKind(body?.type) ? scanResult.value.queueNumber : null;
        const outcome = buildDuplicateScan(body, {
            source: context.source,
            rawCode: context.rawCode,
            fallbackQueue,
        });

        pushResult(outcome.result);
        toast.warning(humanizeErrorMessage(body?.message ?? 'Peserta sudah pernah scan.'), {
            description: outcome.warningDescription,
        });
    }

    /** Catat hasil 422 sebagai invalid lalu tampilkan pesan validasi API. */
    function handleInvalidScan(body: IGlobalScanErrorBody | undefined, context: IScanResultContext): void {
        pushResult(
            buildInvalidScanResult({
                source: context.source,
                rawCode: context.rawCode,
                name: 'Tidak dapat diproses',
                eventKind: scanResult.value?.eventKind ?? 'event',
                eventTitle: scanResult.value?.eventTitle ?? '-',
            })
        );
        showErrorToast(parseApiErrorMessage(body, 'Data tidak valid.'));
    }

    /** Catat hasil 429 sebagai invalid lalu tampilkan pesan tunggu. */
    function handleRateLimitedScan(context: IScanResultContext): void {
        pushResult(
            buildInvalidScanResult({
                source: context.source,
                rawCode: context.rawCode,
                name: 'Terlalu banyak scan',
                eventKind: scanResult.value?.eventKind ?? 'event',
                eventTitle: scanResult.value?.eventTitle ?? '-',
            })
        );
        showErrorToast('Terlalu banyak scan', {
            description: 'Tunggu sebentar sebelum memindai lagi.',
        });
    }

    /** Catat hasil jaringan/kesalahan tak terduga sebagai invalid lalu tampilkan pesan gagal. */
    function handleNetworkScanFailure(error: unknown, context: IScanResultContext): void {
        pushResult(
            buildInvalidScanResult({
                source: context.source,
                rawCode: context.rawCode,
                name: 'Kesalahan jaringan',
                eventKind: scanResult.value?.eventKind ?? 'event',
                eventTitle: scanResult.value?.eventTitle ?? '-',
            })
        );
        showErrorToast('Permintaan gagal', {
            description:
                error instanceof Error ? humanizeErrorMessage(error.message) : 'Coba lagi dalam beberapa saat.',
        });
    }

    /** Arahkan kegagalan POST scan ke penangan sesuai status (409/422/429) atau fallback jaringan. */
    function handleScanFailure(error: unknown, context: IScanResultContext): void {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const body = readScanErrorBody(error);

            if (status === 409) {
                handleDuplicateScan(body, context);
                return;
            }

            if (status === 422) {
                handleInvalidScan(body, context);
                return;
            }

            if (status === 429) {
                handleRateLimitedScan(context);
                return;
            }
        }

        handleNetworkScanFailure(error, context);
    }

    /** Kirim hasil scan ke server lalu catat riwayat/umpan balik; diabaikan saat sedang sibuk. */
    async function submitScan(scanArgs: ISubmitScanArgs): Promise<void> {
        if (scanBusy.value) {
            return;
        }

        const trimmed = scanArgs.raw.trim();
        if (trimmed.length === 0) {
            showErrorToast('Isi kode registrasi terlebih dahulu.');

            return;
        }

        scanBusy.value = true;
        const rawDisplay = extractQrCandidate(trimmed);
        const context: IScanResultContext = { source: scanArgs.source, rawCode: rawDisplay };

        try {
            const { data } = await axios.post<IGlobalScanEnvelope>(
                args.storeUrl,
                { raw: trimmed, desk: deskId },
                { headers: jsonRequestHeaders() }
            );

            const result = buildCheckInResult(data, context);
            showCheckInSuccessToast(data, result);
            pushResult(result);
        } catch (error) {
            handleScanFailure(error, context);
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
