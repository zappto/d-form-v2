import { describe, expect, it } from 'vitest';
import { isStorageHref, normalizeBannerSrc } from '../bannerSrc';

/**
 * DFORM-46 T9 #8: satu pembangun URL kanonik. Bug lama yang dikunci di sini:
 * input `storage/a.jpg` dulu menjadi `/storage/storage/a.jpg`, dan `blob:` dulu
 * kehilangan skemanya di EventBannerImage.
 */

describe('normalizeBannerSrc', () => {
    it('kosong atau spasi tetap kosong', () => {
        expect(normalizeBannerSrc('')).toBe('');
        expect(normalizeBannerSrc('   ')).toBe('');
    });

    it('data URL dibiarkan apa adanya', () => {
        expect(normalizeBannerSrc('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    });

    it('blob URL dibiarkan apa adanya', () => {
        expect(normalizeBannerSrc('blob:http://localhost/uuid')).toBe('blob:http://localhost/uuid');
    });

    it('URL absolut dibiarkan apa adanya', () => {
        expect(normalizeBannerSrc('https://host/storage/a.jpg')).toBe('https://host/storage/a.jpg');
        expect(normalizeBannerSrc('http://host/a.jpg')).toBe('http://host/a.jpg');
    });

    it('path root dibiarkan apa adanya', () => {
        expect(normalizeBannerSrc('/storage/a.jpg')).toBe('/storage/a.jpg');
        expect(normalizeBannerSrc('/img/logo.png')).toBe('/img/logo.png');
    });

    it('path relatif dipetakan ke /storage/<path>', () => {
        expect(normalizeBannerSrc('forms/a.jpg')).toBe('/storage/forms/a.jpg');
        expect(normalizeBannerSrc('form-uploads/1/a.pdf')).toBe('/storage/form-uploads/1/a.pdf');
    });

    it('path berawalan storage/ tidak menghasilkan prefix dobel', () => {
        expect(normalizeBannerSrc('storage/a.jpg')).toBe('/storage/a.jpg');
        expect(normalizeBannerSrc('storage/x.png')).toBe('/storage/x.png');
    });

    it('spasi tepi dibuang sebelum normalisasi', () => {
        expect(normalizeBannerSrc('  storage/a.jpg  ')).toBe('/storage/a.jpg');
    });
});

describe('isStorageHref', () => {
    it('false untuk kosong/teks biasa', () => {
        expect(isStorageHref('')).toBe(false);
        expect(isStorageHref('   ')).toBe(false);
        expect(isStorageHref('halo dunia')).toBe(false);
    });

    it('true untuk URL absolut', () => {
        expect(isStorageHref('https://host/storage/a.jpg')).toBe(true);
        expect(isStorageHref('http://host/a.jpg')).toBe(true);
    });

    it('true untuk path storage absolut maupun relatif', () => {
        expect(isStorageHref('/storage/a.jpg')).toBe(true);
        expect(isStorageHref('storage/a.jpg')).toBe(true);
        expect(isStorageHref('form-uploads/1/a.pdf')).toBe(true);
    });

    it('false untuk path root non-storage', () => {
        expect(isStorageHref('/img/logo.png')).toBe(false);
    });
});
