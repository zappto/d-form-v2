import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useObjectUrl, type IObjectUrlResult } from '../useObjectUrl';

/** Stub URL blob API yang stabil lintas jsdom; kembalikan blob:mock-N agar revoke terlacak. */
function stubBlobUrls(created: string[], revoked: string[]): void {
    let counter = 0;
    if (typeof URL.createObjectURL !== 'function') {
        URL.createObjectURL = (): string => '';
    }
    if (typeof URL.revokeObjectURL !== 'function') {
        URL.revokeObjectURL = (): void => {};
    }
    vi.spyOn(URL, 'createObjectURL').mockImplementation((): string => {
        counter += 1;
        const url = `blob:mock-${counter}`;
        created.push(url);
        return url;
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url: string): void => {
        revoked.push(url);
    });
}

/** Host tipis agar onBeforeUnmount hook berjalan seperti di halaman. */
function mountUrlHost(): { exposed: () => IObjectUrlResult; wrapper: ReturnType<typeof mount> } {
    let exposed: IObjectUrlResult | null = null;
    const host = defineComponent({
        setup() {
            exposed = useObjectUrl();
            return () => h('div', 'host');
        },
    });
    const wrapper = mount(host);
    return {
        exposed: (): IObjectUrlResult => {
            if (exposed === null) throw new Error('hook belum terpasang');
            return exposed;
        },
        wrapper,
    };
}

function makeImageFile(name: string): File {
    return new File(['isi'], name, { type: 'image/png' });
}

describe('useObjectUrl', () => {
    const created: string[] = [];
    const revoked: string[] = [];

    beforeEach(() => {
        created.length = 0;
        revoked.length = 0;
        stubBlobUrls(created, revoked);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('createFromFile mengembalikan object URL dan mengeksposnya via currentUrl', () => {
        const { wrapper, exposed } = mountUrlHost();
        const url = exposed().createFromFile(makeImageFile('a.png'));
        expect(url.startsWith('blob:')).toBe(true);
        expect(exposed().currentUrl.value).toBe(url);
        wrapper.unmount();
    });

    it('ganti URL merevoke lama; clear merevoke aktif lalu reset null', () => {
        const { wrapper, exposed } = mountUrlHost();
        const first = exposed().createFromFile(makeImageFile('a.png'));
        const second = exposed().createFromFile(makeImageFile('b.png'));
        expect(second).not.toBe(first);
        expect(revoked).toEqual([first]);
        expect(exposed().currentUrl.value).toBe(second);

        exposed().clear();
        expect(revoked).toEqual([first, second]);
        expect(exposed().currentUrl.value).toBeNull();
        wrapper.unmount();
    });

    it('unmount merevoke URL aktif yang belum di-clear', () => {
        const { wrapper, exposed } = mountUrlHost();
        const url = exposed().createFromFile(makeImageFile('a.png'));
        wrapper.unmount();
        expect(revoked).toEqual([url]);
    });

    it('non-blob tidak direvoke saat ganti maupun clear', () => {
        const { wrapper, exposed } = mountUrlHost();
        exposed().currentUrl.value = 'https://cdn.example/banner.jpg';
        exposed().clear();
        expect(revoked).toEqual([]);
        expect(exposed().currentUrl.value).toBeNull();

        exposed().currentUrl.value = '/storage/banner.jpg';
        const fresh = exposed().createFromFile(makeImageFile('a.png'));
        expect(revoked).toEqual([]);
        expect(exposed().currentUrl.value).toBe(fresh);
        wrapper.unmount();
    });

    it('clear saat kosong aman tanpa revoke', () => {
        const { wrapper, exposed } = mountUrlHost();
        exposed().clear();
        expect(revoked).toEqual([]);
        wrapper.unmount();
    });
});
