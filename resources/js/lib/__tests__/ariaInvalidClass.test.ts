import { describe, expect, it } from 'vitest';
import { ariaInvalidBorderClass, ariaInvalidRingClass } from '../ariaInvalidClass';

/**
 * DFORM-42: pin token kanonik idiom attribute `aria-invalid` — 4 kelas inti
 * (border + ring, terang + gelap) yang dipakai 5 primitif form.
 */
describe('ariaInvalidClass', () => {
    it('memuat token border attribute beserta varian gelapnya', () => {
        expect(ariaInvalidBorderClass.split(' ')).toEqual([
            'aria-invalid:border-destructive',
            'dark:aria-invalid:border-destructive/70',
        ]);
    });

    it('memuat token ring attribute beserta varian gelapnya', () => {
        expect(ariaInvalidRingClass.split(' ')).toEqual([
            'aria-invalid:ring-destructive/20',
            'dark:aria-invalid:ring-destructive/40',
        ]);
    });
});
