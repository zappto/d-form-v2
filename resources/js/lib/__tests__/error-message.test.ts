import { describe, expect, it } from 'vitest';
import { PASSWORD_MISMATCH_MESSAGE, humanizeErrorMessage } from '../errorMessage';

/**
 * DFORM-46 T9 #5: satu konstanta pesan FE untuk konfirmasi kata sandi.
 * Bukti wajib: kedua varian (dengan/tanpa titik) tetap tampil sebagai teks ID yang sama.
 */

describe('PASSWORD_MISMATCH_MESSAGE', () => {
    it('bernilai varian bertitik', () => {
        expect(PASSWORD_MISMATCH_MESSAGE).toBe('Password does not match.');
    });

    it('kedua varian dipetakan ke teks ID yang sama sehingga string tampil tidak berubah', () => {
        const expected = 'Konfirmasi kata sandi tidak cocok.';
        expect(humanizeErrorMessage('Password does not match.')).toBe(expected);
        expect(humanizeErrorMessage('Password does not match')).toBe(expected);
        expect(humanizeErrorMessage(PASSWORD_MISMATCH_MESSAGE)).toBe(expected);
    });
});
