const FIELD_INVALID_CLASS =
    'border-destructive/70 bg-red-50 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-red-500/10 dark:focus-visible:border-destructive/70';

/** Kelas field invalid kanonik (border/ring destructive + latar merah); string kosong bila valid. */
export function fieldInvalidClass(invalid: boolean): string {
    return invalid ? FIELD_INVALID_CLASS : '';
}
