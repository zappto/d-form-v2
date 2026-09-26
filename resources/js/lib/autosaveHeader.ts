/**
 * Blank-guard untuk required header autosave (title, description).
 *
 * Latar: server (FormAutosaveController + ConvertEmptyStringsToNull) sudah
 * menjadi jaring pengaman — '' menjadi null lalu dilewati untuk kolom NOT
 * NULL. Masalahnya murni di frontend: PATCH yang membawa '' dianggap sukses
 * lalu `lastSentHeader` ikut menyimpan '', sehingga reload menampilkan nilai
 * lama tanpa penjelasan (resurrect diam-diam). Solusi: kecualikan key blank
 * dari payload PATCH + tampilkan invalid inline, dan jadikan `lastSentHeader`
 * cerminan server (key yang tak terkirim mempertahankan nilai sukses lama).
 *
 * Scope kunci: hanya title/description. closed_at/visible_for tak tersentuh.
 */

export const TITLE_REQUIRED_MESSAGE = 'Judul wajib diisi';
export const DESCRIPTION_REQUIRED_MESSAGE = 'Deskripsi wajib diisi';

export type TRequiredHeaderKey = 'title' | 'description';

export interface IRequiredHeaderFields {
    title: string;
    description: string;
}

/** True bila nilai adalah string kosong/blank (trimmed ''). */
export function isBlankRequiredValue(value: unknown): boolean {
    return typeof value === 'string' && value.trim() === '';
}

/** Pesan invalid inline untuk key required, atau undefined bila valid. */
export function requiredHeaderError(kind: TRequiredHeaderKey, value: unknown): string | undefined {
    if (!isBlankRequiredValue(value)) return undefined;
    return kind === 'title' ? TITLE_REQUIRED_MESSAGE : DESCRIPTION_REQUIRED_MESSAGE;
}

/**
 * Kecualikan title/description yang blank dari diff PATCH.
 * Key lain (closed_at, visible_for, banner_*, success_content, metadata)
 * diteruskan apa adanya.
 */
export function stripBlankRequiredKeys<GDiff extends object>(
    diff: GDiff,
    current: IRequiredHeaderFields,
): GDiff {
    const next: Record<string, unknown> = { ...diff };
    if (isBlankRequiredValue(current.title)) delete next.title;
    if (isBlankRequiredValue(current.description)) delete next.description;
    return next as GDiff;
}

/**
 * Gabungkan hasil PATCH sukses ke snapshot terakhir: hanya key yang benar-benar
 * terkirim yang diperbarui; key blank yang dikecualikan mempertahankan nilai
 * sukses lama (= nilai yang masih tersimpan di server).
 */
export function mergeSentHeader<GHeader extends object>(
    prev: GHeader | null,
    current: GHeader,
    sent: Partial<GHeader>,
): GHeader {
    return { ...(prev ?? current), ...sent };
}
