import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BannerPickerField from '../BannerPickerField.vue';

const STORED_URL = 'https://cdn.example/banner-tersimpan.jpg';

/** Stub URL blob API agar object URL stabil dan revoke terlacak lintas jsdom. */
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

function mountField(props: Record<string, unknown> = {}): ReturnType<typeof mount> {
    return mount(BannerPickerField, { props: { file: null, ...props } });
}

/** Pilih berkas lewat input tersembunyi, meniru dialog berkas browser. */
async function pickFile(wrapper: ReturnType<typeof mount>, candidate: File): Promise<void> {
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [candidate], configurable: true });
    await input.trigger('change');
}

function makePng(name: string): File {
    return new File(['isi'], name, { type: 'image/png' });
}

/** Berkas PNG dengan ukuran melewati batas 5 MB (size di-override, isi tak perlu besar). */
function makeOversizedPng(): File {
    const file = makePng('besar.png');
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 });
    return file;
}

describe('BannerPickerField', () => {
    const revoked: string[] = [];

    beforeEach(() => {
        revoked.length = 0;
        stubBlobUrls(revoked);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('mempratinjau initialUrl lalu menggantinya dengan object URL berkas baru', async () => {
        const wrapper = mountField({ initialUrl: STORED_URL, variant: 'frame' });
        expect(wrapper.find('img').attributes('src')).toBe(STORED_URL);

        await pickFile(wrapper, makePng('baru.png'));
        expect(wrapper.find('img').attributes('src')?.startsWith('blob:')).toBe(true);
        expect(wrapper.text()).toContain('baru');
        wrapper.unmount();
    });

    it('emit update:file berisi File terpilih lalu null saat Hapus; blob direvoke', async () => {
        const wrapper = mountField({ initialUrl: STORED_URL, variant: 'plain' });

        await pickFile(wrapper, makePng('baru.png'));
        const first = wrapper.emitted('update:file')?.[0]?.[0];
        expect(first).toBeInstanceOf(File);
        expect((first as File).name).toBe('baru.png');
        const blobUrl = wrapper.find('img').attributes('src') ?? '';
        expect(revoked).not.toContain(blobUrl);

        await wrapper.find('[aria-label="Hapus banner"]').trigger('click');
        const updates = wrapper.emitted('update:file') ?? [];
        expect(updates[updates.length - 1]?.[0]).toBeNull();
        expect(wrapper.find('img').attributes('src')).toBe(STORED_URL);
        expect(revoked).toContain(blobUrl);
        wrapper.unmount();
    });

    it('emit remove saat Hapus walau model sudah null (banner tersimpan tanpa berkas pending)', async () => {
        const wrapper = mountField({ initialUrl: STORED_URL, variant: 'plain' });

        await wrapper.find('[aria-label="Hapus banner"]').trigger('click');

        expect(wrapper.emitted('remove')).toHaveLength(1);
        expect(wrapper.emitted('update:file')).toBeUndefined();
        wrapper.unmount();
    });

    it('emit remove bersama update:file null saat Hapus membuang berkas pending', async () => {
        const wrapper = mountField({ initialUrl: STORED_URL, variant: 'plain' });
        await pickFile(wrapper, makePng('unggulan.png'));

        await wrapper.find('[aria-label="Hapus banner"]').trigger('click');

        expect(wrapper.emitted('remove')).toHaveLength(1);
        const updates = wrapper.emitted('update:file') ?? [];
        expect(updates[updates.length - 1]?.[0]).toBeNull();
        wrapper.unmount();
    });

    it('mengosongkan model dari luar mereset pratinjau ke initialUrl dan merevoke blob', async () => {
        const wrapper = mountField({ initialUrl: STORED_URL, variant: 'plain' });
        const candidate = makePng('unggulan.png');
        await pickFile(wrapper, candidate);
        const blobUrl = wrapper.find('img').attributes('src') ?? '';
        expect(blobUrl.startsWith('blob:')).toBe(true);
        expect(wrapper.text()).toContain('baru');

        await wrapper.setProps({ file: candidate });
        await wrapper.setProps({ file: null });

        expect(wrapper.find('img').attributes('src')).toBe(STORED_URL);
        expect(revoked).toContain(blobUrl);
        expect(wrapper.text()).not.toContain('baru');
        wrapper.unmount();
    });

    it('menolak berkas non-gambar dengan copy galat tanpa mengubah pratinjau', async () => {
        const wrapper = mountField({ variant: 'plain' });
        await pickFile(wrapper, new File(['isi'], 'catatan.txt', { type: 'text/plain' }));

        expect(wrapper.text()).toContain('Gunakan PNG, JPG, JPEG, atau GIF.');
        expect(wrapper.emitted('update:file')).toBeUndefined();
        expect(wrapper.find('img').exists()).toBe(false);
        wrapper.unmount();
    });

    it('menolak berkas lebih dari 5 MB dengan copy galat', async () => {
        const wrapper = mountField({ variant: 'plain' });
        await pickFile(wrapper, makeOversizedPng());

        expect(wrapper.text()).toContain('Ukuran banner maksimal 5 MB.');
        expect(wrapper.emitted('update:file')).toBeUndefined();
        expect(wrapper.find('img').exists()).toBe(false);
        wrapper.unmount();
    });

    it('menampilkan error konsumen dan menandai bidang invalid', () => {
        const wrapper = mountField({ variant: 'plain', error: 'Banner wajib diisi.', invalid: true });

        expect(wrapper.text()).toContain('Banner wajib diisi.');
        expect(wrapper.html()).toContain('border-destructive/70');
        expect(wrapper.find('input[type="file"]').attributes('aria-invalid')).toBe('true');
        wrapper.unmount();
    });

    it('merevoke blob aktif saat unmount', async () => {
        const wrapper = mountField({ variant: 'frame' });
        await pickFile(wrapper, makePng('baru.png'));
        const blobUrl = wrapper.find('img').attributes('src') ?? '';

        wrapper.unmount();
        expect(revoked).toContain(blobUrl);
    });

    it('tidak pernah merevoke initialUrl non-blob', () => {
        const wrapper = mountField({ initialUrl: STORED_URL, variant: 'plain' });
        wrapper.unmount();
        expect(revoked).toEqual([]);
    });

    it('mengikuti perubahan prop initialUrl selama tidak ada berkas baru', async () => {
        const wrapper = mountField({ initialUrl: null, variant: 'plain' });
        expect(wrapper.find('img').exists()).toBe(false);

        await wrapper.setProps({ initialUrl: STORED_URL });
        expect(wrapper.find('img').attributes('src')).toBe(STORED_URL);
        wrapper.unmount();
    });
});
