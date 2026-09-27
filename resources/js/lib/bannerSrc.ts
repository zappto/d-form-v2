/** Public URL / data URL / relative storage path → safe display URL for <img>. */
export function normalizeBannerSrc(raw: string): string {
    const u = raw.trim();
    if (!u) return '';
    if (u.startsWith('data:')) return u;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('blob:')) return u;
    if (u.startsWith('/')) return u;
    return `/storage/${u.replace(/^\/+/, '')}`;
}
