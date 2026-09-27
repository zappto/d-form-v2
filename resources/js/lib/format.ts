/** Satuan biner; penyebut tunggal ukuran berkas B/KB/MB. */
const BYTES_PER_UNIT = 1024;

/** Lebar minimum nomor antrean; satu digit di-pad nol di depan. */
const QUEUE_NUMBER_MIN_WIDTH = 2;

/** Inisial kosong memakai strip seperti badge avatar. */
const EMPTY_INITIALS_MARK = '—';

/** Format tanggal pendek id-ID; dipakai daftar event, registrant, dan email peserta. */
export function formatDisplayDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format tanggal + jam id-ID; dipakai detail event dan registrasi pengguna. */
export function formatDisplayDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Format waktu submission id-ID; satu-satunya definisi untuk tiga call-site tabel. */
export function formatSubmissionDateTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/** Format cacah id-ID; dipakai total, kuota, dan statistik pendaftar. */
export function formatCountNumber(count: number): string {
    return new Intl.NumberFormat('id-ID').format(count);
}

/** Tooltip chart id-ID plus satuan call-site; satuan tetap argumen agar copy tak tercampur. */
export function formatChartCount(count: number, unit: string): string {
    return `${count.toLocaleString('id-ID')} ${unit}`;
}

/** Tick sumbu chart id-ID; non-angka dikembalikan utuh seperti callback lama. */
export function chartTickCallback(tickValue: number | string): string {
    if (typeof tickValue === 'number') return tickValue.toLocaleString('id-ID');
    return tickValue;
}

/** Format angka harga Rupiah tanpa prefix/fallback; prefix `Rp` + fallback milik call-site. */
export function formatRupiahPrice(amount: number): string {
    return Number(amount).toLocaleString('id-ID');
}

/** Nomor antrean dua digit; kosong menjadi strip agar sel tabel tetap rapi. */
export function padQueueNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return String(value).padStart(QUEUE_NUMBER_MIN_WIDTH, '0');
}

/** Label jam tersimpan draft; kosong saat belum pernah tersimpan. */
export function formatSavedTimeLabel(lastSavedAt: Date | null): string {
    if (lastSavedAt === null) return '';
    return lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/** Ukuran berkas B/KB/MB; null bila tak diketahui agar call-site bisa menyembunyikan. */
export function formatBytes(byteCount: number | null | undefined): string | null {
    if (typeof byteCount !== 'number' || !Number.isFinite(byteCount) || byteCount <= 0) return null;
    if (byteCount < BYTES_PER_UNIT) return `${byteCount} B`;
    if (byteCount < BYTES_PER_UNIT * BYTES_PER_UNIT) return `${(byteCount / BYTES_PER_UNIT).toFixed(1)} KB`;
    return `${(byteCount / (BYTES_PER_UNIT * BYTES_PER_UNIT)).toFixed(1)} MB`;
}

/** Inisial dua huruf nama; dipakai avatar opsi select dan daftar panitia. */
export function initialsOf(fullName: string): string {
    const words: string[] = fullName.trim().split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) return EMPTY_INITIALS_MARK;
    const first: string = words[0]?.charAt(0) ?? '';
    const second: string = words.length > 1 ? (words[1]?.charAt(0) ?? '') : '';
    const letters: string = `${first}${second}`.toUpperCase();
    return letters.length > 0 ? letters : EMPTY_INITIALS_MARK;
}
