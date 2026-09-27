import { describe, expect, it } from 'vitest';
import { eventStatusUi } from '@/lib/eventShowUi';

describe('eventStatusUi (Mx-B status kanonik)', () => {
    it('memetakan label kanonik', () => {
        expect(eventStatusUi('not_yet_open').label).toBe('Segera Dibuka');
        expect(eventStatusUi('open').label).toBe('Dibuka');
        expect(eventStatusUi('closed').label).toBe('Ditutup');
        expect(eventStatusUi('full').label).toBe('Penuh');
    });
    it('memetakan kelas badge kanonik', () => {
        expect(eventStatusUi('not_yet_open').tone).toBe('border-amber-500/25 bg-amber-500/10 text-amber-800');
        expect(eventStatusUi('open').tone).toBe('border-emerald-500/25 bg-emerald-500/10 text-emerald-700');
        expect(eventStatusUi('closed').tone).toBe('border-border bg-muted/60 text-muted-foreground');
        expect(eventStatusUi('full').tone).toBe('border-rose-500/25 bg-rose-500/10 text-rose-700');
    });
    it('tidak lagi memuat kelas dark:', () => {
        expect(eventStatusUi('not_yet_open').tone).not.toContain('dark:');
        expect(eventStatusUi('open').tone).not.toContain('dark:');
        expect(eventStatusUi('closed').tone).not.toContain('dark:');
        expect(eventStatusUi('full').tone).not.toContain('dark:');
    });
});
