import appCss from '../../../../resources/css/app.css?raw';
import appBlade from '../../../../resources/views/app.blade.php?raw';
import { describe, expect, it } from 'vitest';

/**
 * Pin kontrak "dark mode mati": varian `dark:` tetap scope atribut (gerbang mati
 * supaya 6 kelas dark: di ui/** inert), tanpa token gelap, dan color-scheme terang.
 */
describe('gerbang dark mode', () => {
    it('mempertahankan @custom-variant dark yang scope ke atribut', () => {
        expect(appCss).toContain('@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));');
    });

    it('tidak lagi mendefinisikan token gelap', () => {
        expect(appCss).not.toContain("[data-theme='dark']");
        expect(appCss).not.toContain('.dark {');
        expect(appCss).not.toContain('--background: oklch(0.16 0.012 255)');
    });

    it('memaksa color-scheme terang di blade', () => {
        expect(appBlade).toContain('name="color-scheme" content="light"');
        expect(appBlade).not.toContain('content="light dark"');
    });
});
