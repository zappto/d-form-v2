export type TScanStatus = 'success' | 'already' | 'invalid';

export interface TIScanEntry {
    id: string;
    name: string;
    email: string;
    time: string;
    status: TScanStatus;
    source: 'camera' | 'manual';
    eventKind: 'event' | 'oprec';
    eventTitle: string;
    queueNumber: number | null;
}

export interface TIScanResult {
    name: string;
    email: string;
    status: TScanStatus;
    source: 'camera' | 'manual';
    rawCode: string;
    eventKind: 'event' | 'oprec';
    eventTitle: string;
    queueNumber: number | null;
}

/** Ambil kode kandidat dari teks hasil scan (JSON atau teks polos); dipakai saat memproses QR masuk. */
export function extractQrCandidate(decodedText: string): string {
    const raw = decodedText.trim();
    if (!raw.startsWith('{') || !raw.endsWith('}')) {
        return raw;
    }

    try {
        const parsed: unknown = JSON.parse(raw);
        if (!isQrDecodedPayload(parsed)) {
            return raw;
        }

        const candidate =
            parsed.application_id ??
            parsed.submission_id ??
            parsed.token ??
            parsed.code ??
            parsed.qr ??
            parsed.email ??
            parsed.id;
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
    } catch {
        return raw;
    }

    return raw;
}

/** Bentuk entri riwayat scan dari hasil scan; dipakai untuk menambah baris riwayat scan. */
export function createScanHistoryEntry(result: TIScanResult): TIScanEntry {
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: result.name,
        email: result.email,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: result.status,
        source: result.source,
        eventKind: result.eventKind,
        eventTitle: result.eventTitle,
        queueNumber: result.queueNumber,
    };
}

export interface TIGlobalScanFeedRow {
    id: string;
    ts: string;
    type: 'recruitment' | 'event';
    eventTitle: string;
    name: string;
    identifier: string;
    queueNumber: number | null;
}

/** Bentuk payload JSON yang mungkin dibawa QR; seluruh kolom opsional karena berasal dari luar. */
interface IQrDecodedPayload {
    application_id?: string | number | null;
    submission_id?: string | number | null;
    token?: string | number | null;
    code?: string | number | null;
    qr?: string | number | null;
    email?: string | number | null;
    id?: string | number | null;
}

/** Baris mentah feed scan global; seluruh kolom opsional karena berasal dari respons eksternal. */
interface IGlobalScanRawRow {
    id?: string | number | null;
    ts?: string | number | null;
    type?: string | null;
    eventTitle?: string | null;
    name?: string | null;
    identifier?: string | null;
    queueNumber?: string | number | null;
}

/** Payload mentah feed scan global; seluruh kolom opsional karena berasal dari respons eksternal. */
interface IGlobalScanRawPayload {
    rows?: IGlobalScanRawRow[] | null;
    cursor?: string | number | null;
}

/** Guard objek polos payload QR; parameter `unknown` di sini posisi penyempitan. */
function isQrDecodedPayload(value: unknown): value is IQrDecodedPayload {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Guard objek polos satu baris feed; parameter `unknown` di sini posisi penyempitan. */
function isGlobalScanRawRow(value: unknown): value is IGlobalScanRawRow {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Guard objek polos payload feed; parameter `unknown` di sini posisi penyempitan. */
function isGlobalScanRawPayload(value: unknown): value is IGlobalScanRawPayload {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Baca kolom teks dari baris/payload eksternal; '' bila kolom bukan string. */
function readStringValue(value: string | number | null | undefined): string {
    return typeof value === 'string' ? value : '';
}

/** Baca kolom angka dari baris eksternal; null bila kolom bukan angka valid. */
function readQueueNumberValue(value: string | number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Cek bentuk payload feed scan global; dipakai sebagai guard sebelum mem-parse feed. */
export function isGlobalScanFeedPayload(payload: unknown): boolean {
    if (!isGlobalScanRawPayload(payload)) {
        return false;
    }

    return Array.isArray(payload.rows);
}

/** Parse baris feed scan global menjadi daftar terketik sambil melewati baris rusak; dipakai saat memuat feed scan. */
export function parseGlobalScanFeedRows(payload: unknown): TIGlobalScanFeedRow[] {
    if (!isGlobalScanRawPayload(payload)) {
        return [];
    }

    const rawRows: IGlobalScanRawRow[] = Array.isArray(payload.rows) ? payload.rows : [];
    const rows: TIGlobalScanFeedRow[] = [];
    for (const item of rawRows) {
        if (!isGlobalScanRawRow(item)) {
            continue;
        }

        const id = readStringValue(item.id);
        if (id.length === 0) {
            continue;
        }

        rows.push({
            id,
            ts: readStringValue(item.ts),
            type: readStringValue(item.type) === 'recruitment' ? 'recruitment' : 'event',
            eventTitle: readStringValue(item.eventTitle),
            name: readStringValue(item.name),
            identifier: readStringValue(item.identifier),
            queueNumber: readQueueNumberValue(item.queueNumber),
        });
    }

    return rows;
}

/** Ambil cursor pagination dari payload feed scan global; dipakai untuk memuat halaman feed berikutnya. */
export function parseGlobalScanCursor(payload: unknown): string {
    if (!isGlobalScanRawPayload(payload)) {
        return '';
    }

    return readStringValue(payload.cursor);
}
