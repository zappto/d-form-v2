import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useBannerFilePicker, type IBannerFilePickerResult } from '../useBannerFilePicker';

const STORED_URL = 'https://cdn.example/banner-lama.jpg';

/** Stub URL blob API yang stabil lintas jsdom; kembalikan blob:mock-N agar revoke terlacak. */
function stubBlobUrls(revoked: string[]): void {
    let counter = 0;
    if (typeof URL.createObjectURL !== 'function') {
        URL.createObjectURL = (): string => '';
    }
    if (typeof URL.revokeObjectURL !== 'function') {
        URL.revokeObjectURL = (): void => {};
    }
    vi.spyOn(URL, 'createObjectURL').mockImplementation((): string => {
        counter += 1;
        return `blob:mock-${counter}`;
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url: string): void => {
        revoked.push(url);
    });
}

/** Host tipis agar lifecycle hook berjalan seperti di halaman. */
function mountPickerHost(initialUrl: string | null): {
    exposed: () => IBannerFilePickerResult;
    wrapper: ReturnType<typeof mount>;
} {
    let exposed: IBannerFilePickerResult | null = null;
    const host = defineComponent({
        setup() {
            exposed = useBannerFilePicker({ initialUrl });
            return () => h('div', 'host');
        },
    });
    const wrapper = mount(host);
    return {
        exposed: (): IBannerFilePickerResult => {
            if (exposed === null) throw new Error('hook belum terpasang');
            return exposed;
        },
        wrapper,
    };
}

function makeImageFile(name: string): File {
    return new File(['isi'], name, { type: 'image/png' });
}

/** Event drop palsu dengan satu berkas di dataTransfer. */
function fakeDrop(file: File, mime: string): DragEvent {
    const dt = { files: [new File(['isi'], file.name, { type: mime })] };
    const event = new Event('drop', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', { value: dt, configurable: true });
    return event as DragEvent;
}

describe('useBannerFilePicker', () => {
    const revoked: string[] = [];

    beforeEach(() => {
        revoked.length = 0;
        stubBlobUrls(revoked);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('preview awal memakai URL tersimpan; berkas baru diutamakan sebagai object URL', () => {
        const { wrapper, exposed } = mountPickerHost(STORED_URL);
        expect(exposed().bannerPreview.value).toBe(STORED_URL);
        expect(exposed().bannerFile.value).toBeNull();

        exposed().applyFile(makeImageFile('baru.png'));
        expect(exposed().bannerPreview.value?.startsWith('blob:')).toBe(true);
        expect(exposed().bannerFile.value?.name).toBe('baru.png');
        wrapper.unmount();
    });

    it('ganti berkas merevoke preview lama', () => {
        const { wrapper, exposed } = mountPickerHost(STORED_URL);
        exposed().applyFile(makeImageFile('a.png'));
        const first = exposed().bannerPreview.value ?? '';
        exposed().applyFile(makeImageFile('b.png'));
        expect(revoked).toEqual([first]);
        expect(exposed().bannerPreview.value).not.toBe(first);
        wrapper.unmount();
    });

    it('clear mereset ke URL awal dan mengosongkan file; tanpa awal menjadi null', () => {
        const { wrapper, exposed } = mountPickerHost(STORED_URL);
        const fresh = ((): string => {
            exposed().applyFile(makeImageFile('baru.png'));
            return exposed().bannerPreview.value ?? '';
        })();
        exposed().clearSelection();
        expect(revoked).toEqual([fresh]);
        expect(exposed().bannerPreview.value).toBe(STORED_URL);
        expect(exposed().bannerFile.value).toBeNull();
        wrapper.unmount();

        const create = mountPickerHost(null);
        create.exposed().applyFile(makeImageFile('baru.png'));
        create.exposed().clearSelection();
        expect(create.exposed().bannerPreview.value).toBeNull();
        create.wrapper.unmount();
    });

    it('unmount merevoke preview aktif', () => {
        const { wrapper, exposed } = mountPickerHost(STORED_URL);
        exposed().applyFile(makeImageFile('baru.png'));
        const fresh = exposed().bannerPreview.value ?? '';
        wrapper.unmount();
        expect(revoked).toEqual([fresh]);
    });

    it('change input memakai berkas lalu mengosongkan input; drop non-gambar diabaikan', () => {
        const { wrapper, exposed } = mountPickerHost(null);
        const input = document.createElement('input');
        input.type = 'file';
        Object.defineProperty(input, 'files', { value: [makeImageFile('pilih.png')], configurable: true });
        const change = new Event('change', { bubbles: true });
        Object.defineProperty(change, 'target', { value: input, configurable: true });
        exposed().handleInputChange(change);
        expect(exposed().bannerFile.value?.name).toBe('pilih.png');
        expect(input.value).toBe('');

        exposed().handleDrop(fakeDrop(makeImageFile('teks.txt'), 'text/plain'));
        expect(exposed().bannerFile.value?.name).toBe('pilih.png');
        expect(exposed().isDragging.value).toBe(false);

        exposed().handleDrop(fakeDrop(makeImageFile('seret.png'), 'image/png'));
        expect(exposed().bannerFile.value?.name).toBe('seret.png');
        wrapper.unmount();
    });
});
