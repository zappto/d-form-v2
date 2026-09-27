/** Normalkan kategori acara dari array atau string ber-koma menjadi daftar string bersih; dipakai saat membaca kategori dari backend. */
export function toCategoryList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}

/** Ambil kategori utama (elemen pertama) dari nilai kategori acara; dipakai untuk badge/label kategori. */
export function primaryCategory(value: unknown): string {
    return toCategoryList(value)[0] ?? '';
}
