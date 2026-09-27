import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import FormsIndex from '../Index.vue';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';
import { handleInertiaFormErrors } from '@/lib/error-message';
import { toast } from 'vue-sonner';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.4 + Task 8 parked item #1: hapus form —
 * FormController::destroy memakai Inertia::flash('toast', messages.form.delete.success)
 * yang tampil global via usePageFlashToast — toast manual
 * `toast.success(humanizeErrorMessage('Form deleted.'))` ganda (pola Task 4 Events
 * delete) sehingga DIHAPUS; test mengunci: onSuccess → modal tutup + target null +
 * toast.success TIDAK dipanggil. Gagal → handleInertiaFormErrors + modal tetap buka.
 */

const { routerDeleteMock } = vi.hoisted(() => ({ routerDeleteMock: vi.fn() }));

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: {
        post: vi.fn(),
        get: vi.fn(),
        delete: routerDeleteMock,
        reload: vi.fn(),
        visit: vi.fn(),
    },
}));

vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: { template: '<div><slot /></div>' },
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

interface RouterMutationOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

let lastOptions: RouterMutationOptions | undefined;

function lastDeleteOptions(): RouterMutationOptions {
    expect(routerDeleteMock).toHaveBeenCalled();
    expect(lastOptions).toBeDefined();
    return lastOptions as RouterMutationOptions;
}

function demoForm(): IForm {
    return {
        id: 'fo-1',
        title: 'Formulir A',
        description: 'Deskripsi',
        visible_for: [],
        closed_at: '',
        event_id: 'ev-1',
        banner_url: null,
        banner_caption: null,
    };
}

function mountIndex(): VueWrapper<InstanceType<typeof FormsIndex>> {
    return mount(FormsIndex, {
        props: {
            event: { id: 'ev-1', title: 'Acara' },
            forms: [demoForm()],
        },
    });
}

function deleteTrigger(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.text().includes('Hapus'));
    if (!found) throw new Error('tombol Hapus tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
}

function deleteModal(wrapper: VueWrapper): VueWrapper<InstanceType<typeof ConfirmationModal>> {
    return wrapper.findComponent(ConfirmationModal);
}

async function confirmDelete(wrapper: VueWrapper): Promise<void> {
    await deleteTrigger(wrapper).trigger('click');
    await nextTick();
    deleteModal(wrapper).vm.$emit('confirm');
    await nextTick();
}

beforeEach(() => {
    vi.clearAllMocks();
    lastOptions = undefined;
    routerDeleteMock.mockReset();
    routerDeleteMock.mockImplementation((...args: unknown[]) => {
        lastOptions = args[1] as RouterMutationOptions | undefined;
        return undefined;
    });
});

describe('Forms/Index hapus form (Task 8 parked #1)', () => {
    it('konfirmasi → router.delete ke destroy URL', async () => {
        const wrapper = mountIndex();
        try {
            await confirmDelete(wrapper);

            expect(routerDeleteMock).toHaveBeenCalledTimes(1);
            const url = routerDeleteMock.mock.calls[0]?.[0] as string;
            expect(url).toContain('ev-1');
            expect(url).toContain('fo-1');
            expect(deleteModal(wrapper).props('loading')).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('sukses → TANPA toast manual (flash global) + modal tutup', async () => {
        const wrapper = mountIndex();
        try {
            await confirmDelete(wrapper);

            lastDeleteOptions().onSuccess?.();
            lastDeleteOptions().onFinish?.();
            await nextTick();

            // FormController::destroy memakai Inertia::flash('toast') → tampil
            // global; toast manual ganda sehingga tidak ada.
            expect(toast.success).not.toHaveBeenCalled();
            expect(deleteModal(wrapper).props('open')).toBe(false);
            expect(deleteModal(wrapper).props('loading')).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → handleInertiaFormErrors + modal tetap buka', async () => {
        const wrapper = mountIndex();
        try {
            await confirmDelete(wrapper);

            lastDeleteOptions().onError?.({ form: 'Tidak dapat dihapus.' });
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { form: 'Tidak dapat dihapus.' },
                { title: 'Gagal menghapus form' }
            );
            expect(toast.success).not.toHaveBeenCalled();
            expect(deleteModal(wrapper).props('open')).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });
});
