import { describe, expect, it } from 'vitest';
import { fieldInvalidClass } from '../fieldInvalidClass';

/** DFORM-39 (Mx-K): pin kelas invalid kanonik satu-satunya sumber kelas error field. */
describe('fieldInvalidClass', () => {
    it('mengembalikan kelas invalid kanonik saat field tidak valid', () => {
        const invalidClass = fieldInvalidClass(true);

        expect(invalidClass).toContain('border-destructive/70');
        expect(invalidClass).toContain('bg-red-50');
        expect(invalidClass).toContain('focus-visible:border-destructive');
        expect(invalidClass).not.toContain('dark:');
    });

    it('mengembalikan string kosong saat field valid', () => {
        expect(fieldInvalidClass(false)).toBe('');
    });
});
