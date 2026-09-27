import type { TValidationErrors } from '@/lib/error-message';

/**
 * Reads a raw server error by key, including aggregate keys the backend adds
 * outside the form's field map (e.g. `credentials`). Returns null when absent.
 */
export function readFormError(errors: TValidationErrors, key: string): string | null {
    const value = errors[key];
    if (value == null) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value === '' ? null : value;
}
