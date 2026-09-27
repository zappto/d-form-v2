import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Isi berkas sumber sebagai teks — dasar assertion kontrak CSS/blade. */
function readSource(relativePath: string): string {
    return readFileSync(resolve(__dirname, '../../../../', relativePath), 'utf8');
}

/**
 * Pin kontrak "dark mode mati": varian `dark:` tetap scope atribut (gerbang mati
 * supaya 6 kelas dark: di ui/** inert), tanpa token gelap, dan color-scheme terang.
 */
describe('gerbang dark mode', () => {
    const appCss = readSource('resources/css/app.css');
    const blade = readSource('resources/views/app.blade.php');

    it('mempertahankan @custom-variant dark yang scope ke atribut', () => {
        expect(appCss).toContain('@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));');
    });

    it('tidak lagi mendefinisikan token gelap', () => {
        expect(appCss).not.toContain("[data-theme='dark']");
        expect(appCss).not.toContain('.dark {');
        expect(appCss).not.toContain('--background: oklch(0.16 0.012 255)');
    });

    it('memaksa color-scheme terang di blade', () => {
        expect(blade).toContain('name="color-scheme" content="light"');
        expect(blade).not.toContain('content="light dark"');
    });
});
