import { describe, expect, it } from 'vitest';
import { buttonVariants } from '../index';

/** DFORM-39 (Mx-L): pin dua varian baru yang menggantikan tone destructive inline. */
describe('buttonVariants varian destructive turunan', () => {
    it('destructive-ghost memakai tone destructive saat diam dan hover destructive', () => {
        const ghostClass = buttonVariants({ variant: 'destructive-ghost' });

        expect(ghostClass).toContain('text-destructive');
        expect(ghostClass).toContain('hover:bg-destructive/10');
        expect(ghostClass).toContain('shadow-none');
    });

    it('destructive-outline memakai border destructive kanonik dengan hover destructive', () => {
        const outlineClass = buttonVariants({ variant: 'destructive-outline' });

        expect(outlineClass).toContain('border-destructive/30');
        expect(outlineClass).toContain('hover:border-destructive/40');
        expect(outlineClass).toContain('hover:bg-destructive/10');
    });
});
