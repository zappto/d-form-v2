/**
 * Plain-text paragraph formatting for form fill / preview (domain logic, no UI deps).
 * Escapes HTML, preserves line breaks, and linkifies detected URLs.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Matches http(s) URLs, www. links, and common bare hosts (e.g. youtu.be, youtube.com).
 */
const URL_REGEX = /(?:https?:\/\/|www\.|(?:youtu\.be|youtube\.com)\/)[^\s<>"']+/gi;

const TRAILING_URL_PUNCTUATION = /[.,;:!?)\]}>]$/;

/** Escape karakter HTML pada teks mentah; dipakai sebelum menyisipkan konten paragraf ke HTML. */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/** Tambahkan skema https:// pada URL yang belum berskema; dipakai saat membuat tautan dari teks paragraf. */
export function normalizeLinkHref(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
}

function splitUrlTrailingPunctuation(url: string): { href: string; trailing: string } {
    let href = url;
    let trailing = '';

    while (TRAILING_URL_PUNCTUATION.test(href)) {
        trailing = href.slice(-1) + trailing;
        href = href.slice(0, -1);
    }

    return { href, trailing };
}

function linkifyEscapedLine(line: string): string {
    return line.replace(URL_REGEX, (match) => {
        const { href, trailing } = splitUrlTrailingPunctuation(match);
        if (!href) return match;

        const destination = normalizeLinkHref(href);

        return `<a href="${escapeHtml(destination)}" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 transition-colors hover:text-primary/80">${href}</a>${trailing}`;
    });
}

/** Ubah teks paragraf polos menjadi HTML aman (baris baru + tautan terdeteksi); dipakai merender konten paragraf field form. */
export function formatParagraphContentToHtml(raw: string): string {
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!normalized.trim()) return '';

    const escaped = escapeHtml(normalized);
    const lines = escaped.split('\n');

    return lines.map((line) => linkifyEscapedLine(line)).join('<br>');
}
