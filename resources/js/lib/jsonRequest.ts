/**
 * Header JSON+AJAX kanonik untuk request XHR langsung ke endpoint JSON Laravel.
 * Dipakai seragam oleh hook/halaman pemanggil axios/fetch; objek baru tiap panggilan.
 */
export function jsonRequestHeaders(): Record<string, string> {
    return { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
}
