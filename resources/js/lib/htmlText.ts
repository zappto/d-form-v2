/**
 * Ubah HTML menjadi teks polos (tag & spasi dipadatkan) dengan batas panjang opsional;
 * dipakai untuk meta description / JSON-LD teks.
 */
export function stripHtmlToText(html: string | null, maxLength = 320): string {
    if (html == null || html === '') {
        return '';
    }
    let text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length > maxLength) {
        text = text.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
    }

    return text;
}

/** True bila HTML mengandung teks bermakna (tag & `&nbsp;` dibuang); dipakai untuk menyembunyikan zona kosong. */
export function hasMeaningfulHtmlText(html: string | null): boolean {
    if (html == null || html === '') {
        return false;
    }
    const text = html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();
    return text !== '';
}
