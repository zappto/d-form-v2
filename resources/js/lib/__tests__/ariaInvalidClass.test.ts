import { describe, expect, it } from 'vitest';
import { ariaInvalidBorderClass, ariaInvalidRingClass } from '../ariaInvalidClass';

/**
 * Pin token kanonik idiom attribute `aria-invalid` — satu kelas inti per konstanta,
 * tanpa varian gelap (dark mode sudah dihapus; lihat darkModeGate.test.ts).
 */
describe('ariaInvalidClass', () => {
    it('memuat token border attribute tanpa varian gelap', () => {
        expect(ariaInvalidBorderClass.split(' ')).toEqual(['aria-invalid:border-destructive']);
    });

    it('memuat token ring attribute tanpa varian gelap', () => {
        expect(ariaInvalidRingClass.split(' ')).toEqual(['aria-invalid:ring-destructive/20']);
    });

    it('tidak lagi memuat kelas dark:', () => {
        expect(ariaInvalidBorderClass).not.toContain('dark:');
        expect(ariaInvalidRingClass).not.toContain('dark:');
    });
});
