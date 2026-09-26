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

/** Pesan invalid per key required; sumber tunggal untuk guard + strip. */
const REQUIRED_HEADER_MESSAGE: Record<TRequiredHeaderKey, string> = {
    title: TITLE_REQUIRED_MESSAGE,
    description: DESCRIPTION_REQUIRED_MESSAGE,
};

/** True bila nilai adalah string kosong/blank (trimmed ''). */
export function isBlankRequiredValue(value: unknown): boolean {
    return typeof value === 'string' && value.trim() === '';
}

/** Pesan invalid inline untuk key required, atau undefined bila valid. */
export function requiredHeaderError(kind: TRequiredHeaderKey, value: unknown): string | undefined {
    return isBlankRequiredValue(value) ? REQUIRED_HEADER_MESSAGE[kind] : undefined;
}

/**
 * Kecualikan title/description yang blank dari diff PATCH.
 * Key lain (closed_at, visible_for, banner_*, success_content, metadata)
 * diteruskan apa adanya.
 */
export function stripBlankRequiredKeys<GDiff extends Partial<IRequiredHeaderFields>>(
    diff: GDiff,
    current: IRequiredHeaderFields,
): GDiff {
    const next: GDiff = { ...diff };
    // Object.keys selalu string[] di TS; cast sempit ini satu-satunya cara iterasi runtime.
    for (const key of Object.keys(REQUIRED_HEADER_MESSAGE) as TRequiredHeaderKey[]) {
        if (isBlankRequiredValue(current[key])) delete next[key];
    }
    return next;
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
