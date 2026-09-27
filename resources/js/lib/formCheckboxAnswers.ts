/**
 * Pure checkbox-answer helpers for form fill (domain logic, no UI/framework deps).
 */

export function isCheckboxOptionSelected(selected: unknown, option: string): boolean {
    return Array.isArray(selected) && selected.includes(option);
}

/** True bila nilai answer berupa array (kontrak elemen: string); menyempitkan `unknown` tanpa cast. */
function isCheckboxAnswerList(value: unknown): value is string[] {
    return Array.isArray(value);
}

/** Hitung daftar pilihan checkbox baru setelah opsi dicentang/dilepas; dipakai saat mengisi field checkbox. */
export function toggleCheckboxSelection(selected: unknown, option: string, checked: boolean): string[] {
    const current = isCheckboxAnswerList(selected) ? [...selected] : [];
    return checked ? [...current, option] : current.filter((value) => value !== option);
}
