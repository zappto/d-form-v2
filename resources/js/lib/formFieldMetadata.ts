import type { TFormFieldMetadataBag, TFormFieldMetadataValue, TFormFieldRules } from '@/types/form';

/**
 * Baca flag boolean dari metadata API/Laravel tanpa jebakan `Boolean("false") === true`.
 */
export function readMetaBoolean(meta: TFormFieldMetadataBag, key: string): boolean {
    const v = meta[key];
    if (v === true || v === 1) return true;
    if (v === false || v === 0 || v === null || v === undefined) return false;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === '' || s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
        if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    }
    return Boolean(v);
}

/** True bila value berupa bag metadata JSON-like (objek non-null, bukan array); menyempitkan payload tanpa cast. */
export function isMetadataBag(value: unknown): value is TFormFieldMetadataBag {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** True bila value berbentuk objek rules field (bag JSON-like); dipakai menyempitkan `metadata.rules` tanpa cast. */
export function isFormFieldRules(value: unknown): value is TFormFieldRules {
    return isMetadataBag(value);
}

/** Baca nilai metadata sebagai teks; non-string (malformed) menjadi '' alih-alih diteruskan sebagai objek/angka. */
export function readMetaText(value: TFormFieldMetadataValue | undefined): string {
    return typeof value === 'string' ? value : '';
}

/** Baca nilai metadata sebagai angka valid; non-number/NaN/Infinity menjadi null, pemanggil menentukan fallback. */
export function readMetaNumber(value: TFormFieldMetadataValue | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Ambil metadata field sebagai objek (mendukung JSON string dan array); dipakai sebelum membaca rules/flag field. */
export function readFieldMetadata(field: IFormField): TFormFieldMetadataBag {
    let m: unknown = field.metadata;
    if (typeof m === 'string' && m.trim()) {
        try {
            m = JSON.parse(m);
        } catch {
            /* not valid JSON, keep as-is */
        }
    }
    if (Array.isArray(m)) {
        m = m.find((item) => isMetadataBag(item)) ?? {};
    }
    return isMetadataBag(m) ? m : {};
}

/** Ambil objek rules dari metadata field; dipakai untuk validasi dan render aturan field. */
export function readFieldRules(field: IFormField): TFormFieldRules {
    const raw = readFieldMetadata(field).rules;
    return isFormFieldRules(raw) ? raw : {};
}
