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

/** Argumen hitung daftar checkbox baru (nilai kini + opsi + status centang). */
export interface IToggleCheckboxSelectionArgs {
    /** Nilai jawaban kini dari form; non-array dianggap kosong dan disempitkan guard. */
    selected: unknown;
    option: string;
    checked: boolean;
}

/** Hitung daftar pilihan checkbox baru setelah opsi dicentang/dilepas; dipakai saat mengisi field checkbox. */
export function toggleCheckboxSelection(args: IToggleCheckboxSelectionArgs): string[] {
    const current = isCheckboxAnswerList(args.selected) ? [...args.selected] : [];
    return args.checked ? [...current, args.option] : current.filter((value) => value !== args.option);
}

/** Argumen toggle satu opsi checkbox (nama field + opsi + status centang). */
export interface ICheckboxToggleArgs {
    fieldName: string;
    option: string;
    checked: boolean;
}

/** Akses baca-tulis jawaban checkbox milik form pemanggil (Inertia useForm apa pun). */
export interface ICheckboxAnswerAccess {
    read: (fieldName: string) => unknown;
    write: (fieldName: string, selected: string[]) => void;
}

/** Buat penangan toggle checkbox satu-argumen dari akses form; dipakai halaman isi form & undangan tim dari satu sumber. */
export function createCheckboxToggleHandler(access: ICheckboxAnswerAccess): (args: ICheckboxToggleArgs) => void {
    return (args: ICheckboxToggleArgs): void => {
        access.write(
            args.fieldName,
            toggleCheckboxSelection({
                selected: access.read(args.fieldName),
                option: args.option,
                checked: args.checked,
            })
        );
    };
}
