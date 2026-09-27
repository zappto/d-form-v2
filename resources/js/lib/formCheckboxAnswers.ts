/**
 * Pure checkbox-answer helpers for form fill (domain logic, no UI/framework deps).
 */

export function isCheckboxOptionSelected(selected: unknown, option: string): boolean {
    return Array.isArray(selected) && selected.includes(option);
}

/** Hitung daftar pilihan checkbox baru setelah opsi dicentang/dilepas; dipakai saat mengisi field checkbox. */
export function toggleCheckboxSelection(selected: unknown, option: string, checked: boolean): string[] {
    const current = Array.isArray(selected) ? [...(selected as string[])] : [];
    return checked ? [...current, option] : current.filter((value) => value !== option);
}
