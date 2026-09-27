import { describe, expect, it } from 'vitest';
import {
    DESCRIPTION_REQUIRED_MESSAGE,
    isBlankRequiredValue,
    mergeSentHeader,
    requiredHeaderError,
    stripBlankRequiredKeys,
    TITLE_REQUIRED_MESSAGE,
    type TRequiredHeaderFields,
} from '../autosaveHeader';

interface Header {
    title: string;
    description: string;
    success_content: string | null;
    closed_at: string | null;
    visible_for: string[];
}

function header(overrides: Partial<Header> = {}): Header {
    return {
        title: 'Judul lama',
        description: 'Deskripsi lama',
        success_content: 'ok',
        closed_at: null,
        visible_for: ['public'],
        ...overrides,
    };
}

describe('isBlankRequiredValue', () => {
    it('blank: string kosong dan whitespaces', () => {
        expect(isBlankRequiredValue('')).toBe(true);
        expect(isBlankRequiredValue('   ')).toBe(true);
        expect(isBlankRequiredValue('\t\n ')).toBe(true);
    });

    it('valid: teks non-blank dan nilai nullish', () => {
        expect(isBlankRequiredValue('Judul')).toBe(false);
        expect(isBlankRequiredValue(' a ')).toBe(false);
        expect(isBlankRequiredValue(null)).toBe(false);
        expect(isBlankRequiredValue(undefined)).toBe(false);
    });
});

describe('requiredHeaderError', () => {
    it('pesan mengikuti key required', () => {
        expect(requiredHeaderError('title', '')).toBe(TITLE_REQUIRED_MESSAGE);
        expect(requiredHeaderError('title', '   ')).toBe('Judul wajib diisi');
        expect(requiredHeaderError('description', '')).toBe(DESCRIPTION_REQUIRED_MESSAGE);
        expect(requiredHeaderError('description', '  ')).toBe('Deskripsi wajib diisi');
    });

    it('undefined bila valid', () => {
        expect(requiredHeaderError('title', 'Ada')).toBeUndefined();
        expect(requiredHeaderError('description', 'Ada')).toBeUndefined();
    });
});

describe('stripBlankRequiredKeys', () => {
    it('mengecualikan title/description blank, key lain lolos', () => {
        const diff = { title: '', description: '   ', success_content: 'baru', closed_at: null };
        const stripped = stripBlankRequiredKeys(diff, { title: '', description: '   ' });
        expect(stripped).toEqual({ success_content: 'baru', closed_at: null });
        expect('title' in stripped).toBe(false);
        expect('description' in stripped).toBe(false);
    });

    it('title/description valid tetap ikut', () => {
        const diff = { title: 'Baru', description: 'Baru juga' };
        expect(stripBlankRequiredKeys(diff, { title: 'Baru', description: 'Baru juga' })).toEqual(diff);
    });

    it('tak menyentuh closed_at/visible_for', () => {
        const diff: Partial<TRequiredHeaderFields> & {
            closed_at: string | null;
            visible_for: string[];
        } = { closed_at: null, visible_for: [] };
        const current: TRequiredHeaderFields = { title: '', description: '' };
        expect(stripBlankRequiredKeys(diff, current)).toEqual(diff);
    });
});

describe('mergeSentHeader', () => {
    it('key yang tak terkirim mempertahankan nilai sukses lama (server truth)', () => {
        const prev = header();
        const current = header({ title: '', description: '   ' });
        // Simulasikan diff penuh lalu strip agar hanya key berubah yang digabung.
        const fullDiff = { title: '', description: '   ' };
        const filtered = stripBlankRequiredKeys(fullDiff, current);
        expect(filtered).toEqual({});
        const next = mergeSentHeader(prev, current, filtered);
        expect(next.title).toBe('Judul lama');
        expect(next.description).toBe('Deskripsi lama');
    });

    it('key valid yang terkirim ikut snapshot berikutnya', () => {
        const prev = header();
        const current = header({ title: 'Judul baru' });
        const next = mergeSentHeader(prev, current, { title: 'Judul baru' });
        expect(next.title).toBe('Judul baru');
        expect(next.description).toBe('Deskripsi lama');
    });
});

describe('e2e logika diff: kosong-untuk-required', () => {
    it('blank saja → tak ada key terkirim (save jujur false, bukan error)', () => {
        const prev = header();
        const current = header({ title: '', description: '   ' });
        // diff per-key ala halaman: hanya key berubah.
        const fullDiff: Partial<Header> = {};
        (Object.keys(current) as Array<keyof Header>).forEach((key) => {
            if (JSON.stringify(current[key]) !== JSON.stringify(prev[key])) {
                (fullDiff as Record<string, unknown>)[key] = current[key];
            }
        });
        expect(Object.keys(fullDiff).sort()).toEqual(['description', 'title']);

        const sendable = stripBlankRequiredKeys(fullDiff, current);
        expect(sendable).toEqual({});
        const hasFieldChanges = false;
        expect(hasFieldChanges || Object.keys(sendable).length > 0).toBe(false);
    });

    it('isi kembali valid → key ikut PATCH berikutnya', () => {
        const serverTruth = header();
        // Setelah blank dikecualikan, lastSent tetap = server truth.
        const lastSent = mergeSentHeader(serverTruth, header({ title: '' }), {});
        const refilled = header({ title: 'Judul baru' });
        const fullDiff: Partial<Header> = {};
        (Object.keys(refilled) as Array<keyof Header>).forEach((key) => {
            if (JSON.stringify(refilled[key]) !== JSON.stringify(lastSent[key])) {
                (fullDiff as Record<string, unknown>)[key] = refilled[key];
            }
        });
        const sendable = stripBlankRequiredKeys(fullDiff, refilled);
        expect(sendable).toEqual({ title: 'Judul baru' });
        expect(Object.keys(sendable).length > 0).toBe(true);
    });
});
