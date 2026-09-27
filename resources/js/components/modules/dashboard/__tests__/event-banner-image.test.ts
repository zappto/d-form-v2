import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EventBannerImage from '../EventBannerImage.vue';

/**
 * DFORM-46 T9 #8: EventBannerImage memakai pembangun URL kanonik (lib/bannerSrc).
 * Bug lama yang dikunci: `blob:` menjadi `/storage/blob:...`, dan `storage/a.jpg` menjadi `/storage/storage/a.jpg`.
 */

function imgSrc(src: string | null): string | undefined {
    const wrapper = mount(EventBannerImage, { props: { src, alt: 'banner' } });
    const img = wrapper.find('img');
    return img.exists() ? img.attributes('src') : undefined;
}

describe('EventBannerImage resolvedSrc', () => {
    it('blob URL dipertahankan apa adanya', () => {
        expect(imgSrc('blob:http://localhost/uuid')).toBe('blob:http://localhost/uuid');
    });

    it('path storage/ tidak didobel', () => {
        expect(imgSrc('storage/a.jpg')).toBe('/storage/a.jpg');
    });

    it('path form-uploads dipetakan ke /storage/', () => {
        expect(imgSrc('form-uploads/1/a.pdf')).toBe('/storage/form-uploads/1/a.pdf');
    });

    it('path root dan URL absolut dibiarkan apa adanya', () => {
        expect(imgSrc('/storage/a.jpg')).toBe('/storage/a.jpg');
        expect(imgSrc('https://host/a.jpg')).toBe('https://host/a.jpg');
    });

    it('kosong/null tidak merender gambar', () => {
        expect(imgSrc('')).toBeUndefined();
        expect(imgSrc(null)).toBeUndefined();
    });
});
