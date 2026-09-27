import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Pin kontrak "dark mode mati" pada berkas sumber: varian `dark:` tetap scope atribut
 * (gerbang mati supaya 6 kelas dark: di ui/** inert), tanpa token gelap, color-scheme terang.
 * Di luar resources/js karena skop tipe frontend sengaja tanpa tipe Node dan vitest men-stub impor CSS.
 */
const REPO_ROOT = resolve(__dirname, '../../..');

/** Isi berkas sumber sebagai teks; dipakai assertion kontrak CSS/blade. */
function readSource(relativePath: string): string {
    return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('gerbang dark mode', () => {
    const appCss = readSource('resources/css/app.css');
    const appBlade = readSource('resources/views/app.blade.php');

    it('membaca sumber yang benar (penjaga anti-lulus-palsu)', () => {
        expect(appCss.length).toBeGreaterThan(1000);
        expect(appCss).toContain('@theme inline {');
        expect(appBlade).toContain('<html lang=');
    });

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
