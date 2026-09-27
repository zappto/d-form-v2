import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import DivisionListSheet, { type TIDashboardDivision } from '../DivisionListSheet.vue';
import { handleInertiaFormErrors } from '@/lib/error-message';
import { toast } from 'vue-sonner';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 5: simpan edit divisi (router.put) —
 * saat isSaving: CometSpinner 16px + 'Menyimpan...' + disabled + aria-busy;
 * sukses → kembali ke mode lihat TANPA toast manual ganda
 * (sukses sudah ditampilkan global via flash `toast` server → usePageFlashToast);
 * gagal → handleInertiaFormErrors + tetap mode edit; simpan ganda → satu request.
 */

const { routerPutMock } = vi.hoisted(() => ({
    routerPutMock:
        vi.fn<(url: string, data: Record<string, string | boolean>, options?: InertiaMutationOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', () => ({
    router: {
        put: routerPutMock,
        post: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        reload: vi.fn(),
        visit: vi.fn(),
    },
}));

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

interface InertiaMutationOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

function lastPutOptions(): InertiaMutationOptions {
    const calls = routerPutMock.mock.calls;
    expect(routerPutMock).toHaveBeenCalled();
    const options = calls[calls.length - 1]?.[2];
    expect(options).toBeDefined();
    return options as InertiaMutationOptions;
}

const demoDivision: TIDashboardDivision = {
    id: 'div-1',
    code: 'DV',
    name: 'Divisi A',
    description: null,
    is_active: true,
    sort_order: 1,
    interviewer_assignments_count: 2,
};

function mountSheet(): VueWrapper {
    return mount(DivisionListSheet, {
        props: { open: true, divisions: [demoDivision] },
        global: {
            stubs: {
                Sheet: true,
                SheetContent: true,
                SheetHeader: true,
                SheetTitle: true,
                SheetDescription: true,
            },
        },
    });
}

async function openEdit(wrapper: VueWrapper): Promise<void> {
    const edit = wrapper.findAll('button').find((b) => b.text() === 'Edit');
    if (!edit) throw new Error('tombol Edit tidak ditemukan');
    await (edit as DOMWrapper<HTMLButtonElement>).trigger('click');
    await nextTick();
}

function saveButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Simpan') || b.text().includes('Menyimpan...'));
    if (!found) throw new Error('tombol Simpan tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
}

function isEditing(wrapper: VueWrapper): boolean {
    return wrapper.find('form').exists();
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('DivisionListSheet simpan (Task 5)', () => {
    it('simpan valid → sibuk (spinner + Menyimpan... + disabled + aria-busy) + PUT', async () => {
        const wrapper = mountSheet();
        try {
            await openEdit(wrapper);
            await wrapper.find('input').setValue('Divisi Baru');
            await wrapper.find('form').trigger('submit');
            await nextTick();

            expect(routerPutMock).toHaveBeenCalledTimes(1);
            expect(routerPutMock.mock.calls[0]?.[1]).toEqual({
                name: 'Divisi Baru',
                is_active: true,
            });

            const btn = saveButton(wrapper);
            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
            expect(btn.find('[role="status"]').exists()).toBe(true);
            expect(btn.text()).toContain('Menyimpan...');
        } finally {
            wrapper.unmount();
        }
    });

    it('sukses → kembali ke mode lihat, tanpa toast manual ganda', async () => {
        const wrapper = mountSheet();
        try {
            await openEdit(wrapper);
            await wrapper.find('input').setValue('Divisi Baru');
            await wrapper.find('form').trigger('submit');
            await nextTick();

            const options = lastPutOptions();
            options.onSuccess?.();
            options.onFinish?.();
            await nextTick();

            expect(isEditing(wrapper)).toBe(false);
            expect(toast.success).not.toHaveBeenCalled();
            expect(handleInertiaFormErrors).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → handleInertiaFormErrors + tetap mode edit + pulih setelah finish', async () => {
        const wrapper = mountSheet();
        try {
            await openEdit(wrapper);
            await wrapper.find('input').setValue('Divisi Baru');
            await wrapper.find('form').trigger('submit');
            await nextTick();

            const options = lastPutOptions();
            options.onError?.({ name: 'Nama sudah dipakai.' });
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { name: 'Nama sudah dipakai.' },
                { title: 'Gagal memperbarui divisi' }
            );
            expect(isEditing(wrapper)).toBe(true);

            options.onFinish?.();
            await nextTick();
            expect(isEditing(wrapper)).toBe(true);
            expect(saveButton(wrapper).attributes('disabled')).toBeUndefined();
        } finally {
            wrapper.unmount();
        }
    });

    it('simpan ganda saat isSaving → hanya satu request', async () => {
        const wrapper = mountSheet();
        try {
            await openEdit(wrapper);
            await wrapper.find('input').setValue('Divisi Baru');
            await wrapper.find('form').trigger('submit');
            await nextTick();
            await wrapper.find('form').trigger('submit');
            await nextTick();

            expect(routerPutMock).toHaveBeenCalledTimes(1);
        } finally {
            wrapper.unmount();
        }
    });
});
