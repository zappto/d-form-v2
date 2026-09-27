import { describe, expect, it } from 'vitest';
import {
    USER_AVATAR_FALLBACK_PALETTE,
    userAvatarFallbackClasses,
    userAvatarFallbackPaletteIndex,
    userAvatarSeed,
} from '../userAvatarFallback';

/** DFORM-46 Task 3: indeks palet harus deterministik & selalu dalam rentang; kelas fallback tak melempar. */

const SEEDS = ['', 'anonymous', 'user-1', 'a@b.com', 'á'.repeat(64)];

describe('userAvatarFallback (DFORM-46 T3)', () => {
    it('indeks palet deterministik dan selalu dalam rentang', () => {
        for (const seed of SEEDS) {
            const index = userAvatarFallbackPaletteIndex(seed);
            expect(Number.isInteger(index)).toBe(true);
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(USER_AVATAR_FALLBACK_PALETTE.length);
            expect(userAvatarFallbackPaletteIndex(seed)).toBe(index);
        }
    });

    it('kelas fallback selalu objek string valid tanpa melempar', () => {
        for (const seed of SEEDS) {
            const classes = userAvatarFallbackClasses(seed);
            expect(typeof classes.bg).toBe('string');
            expect(typeof classes.icon).toBe('string');
            expect(classes.bg.length).toBeGreaterThan(0);
            expect(classes.icon.length).toBeGreaterThan(0);
        }
    });

    it('seed identik menghasilkan kelas identik', () => {
        expect(userAvatarFallbackClasses('user-1')).toEqual(userAvatarFallbackClasses('user-1'));
    });

    it('seed dari user id atau email stabil', () => {
        expect(userAvatarSeed({ id: 'u-1', email: 'a@b.com' })).toBe('u-1');
        expect(userAvatarSeed({ id: '  ', email: 'A@B.com' })).toBe('a@b.com');
        expect(userAvatarSeed(null)).toBe('anonymous');
    });
});
