/** Prefix URL disk public; bentuk kanonik mengikuti backend `App\Support\PublicStorage::url`. */
const PUBLIC_STORAGE_PREFIX = '/storage/';

/**
 * Normalisasi sumber gambar/berkas menjadi URL tampil aman untuk `<img>`/`<a>`.
 * Data URL, `blob:`, URL absolut, dan path root dibiarkan apa adanya; path relatif
 * disk public (termasuk yang sudah berawalan `storage/`) dipetakan ke `/storage/<path>`.
 */
export function normalizeBannerSrc(raw: string): string {
    const u = raw.trim();
    if (!u) return '';
    if (u.startsWith('data:') || u.startsWith('blob:')) return u;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return u;
    return `${PUBLIC_STORAGE_PREFIX}${u.replace(/^\/+/, '').replace(/^storage\//, '')}`;
}

/**
 * True bila href menunjuk berkas disk public yang bisa dibuka/diunduh:
 * URL absolut, path `/storage/...`, atau path relatif storage (`storage/`, `form-uploads/`).
 * Predikat bersama untuk deteksi tautan berkas (event registration & jawaban form builder).
 */
export function isStorageHref(value: string): boolean {
    const v = value.trim();
    if (!v) return false;
    if (/^https?:\/\//i.test(v)) return true;
    return v.startsWith(PUBLIC_STORAGE_PREFIX) || v.startsWith('storage/') || v.startsWith('form-uploads/');
}
