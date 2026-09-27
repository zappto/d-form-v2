import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import EventsIndex from '../Index.vue';
import { handleInertiaFormErrors } from '@/lib/error-message';
import { toast } from 'vue-sonner';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 4 (lanjutan Task 3): hapus event —
 * confirm → router.delete + flag isDeleting (confirm terkunci via :loading);
 * sukses → modal tutup + target dibersihkan TANPA toast manual ganda
 * (sukses sudah ditampilkan global via flash `toast` server → usePageFlashToast);
 * gagal → handleInertiaFormErrors + modal tetap buka; finish → flag pulih.
 */

const { routerDeleteMock } = vi.hoisted(() => ({ routerDeleteMock: vi.fn() }));

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: { post: vi.fn(), get: vi.fn(), delete: routerDeleteMock, reload: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props: { auth: { user: { can_manage_events: true } } } }),
}));

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));

/** EmptyState menarik lottie-web yang crash di jsdom (canvas) — diganti stub modul. */
vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({ default: { template: '<div />' } }));

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

interface IRouterMutationOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

function lastDeleteOptions(): IRouterMutationOptions {
    const calls = routerDeleteMock.mock.calls as unknown[][];
    expect(routerDeleteMock).toHaveBeenCalled();
    const options = calls[calls.length - 1]?.[1] as IRouterMutationOptions | undefined;
    expect(options).toBeDefined();
    return options as IRouterMutationOptions;
}

const demoEvent: IEvent = {
    id: 'evt-1',
    slug: 'demo-day',
    title: 'Demo Day',
    description: 'Acara demo',
    start_date: '2026-10-01',
    end_date: '2026-10-02',
    registration_start: '2026-09-01',
    registration_end: '2026-09-30',
    location: 'Gedung A',
    quota: 100,
    registered_count: 10,
    banner: '',
    banner_url: null,
    price: 0,
    session: [],
    category: [],
    status: 'published',
    registration_status: 'open',
    deleted_at: null,
    created_at: '2026-09-01',
    updated_at: '2026-09-01',
};

function mountIndex(): VueWrapper {
    return mount(EventsIndex, {
        props: {
            events: {
                data: [demoEvent],
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 1,
                from: 1,
                to: 1,
            },
            filterOptions: { categories: [], sessions: [], statuses: [] },
            query: {},
        },
        global: {
            stubs: {
                EventFilterBar: true,
                EmptyState: true,
                EventCard: {
                    props: ['event'],
                    template: '<button data-test="card-delete" @click="$emit(\'delete\', event)">Hapus acara</button>',
                },
                ConfirmationModal: {
                    props: ['open', 'loading'],
                    template: `<div v-if="open">
                        <button data-test="confirm" :disabled="loading" :aria-busy="String(!!loading)" @click="$emit('confirm')">Confirm</button>
                        <button data-test="cancel" @click="$emit('cancel')">Cancel</button>
                    </div>`,
                },
            },
        },
    }) as unknown as VueWrapper;
}

function confirmButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.find('[data-test="confirm"]');
    if (!found.exists()) throw new Error('tombol confirm modal tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
}

async function openDeleteModal(wrapper: VueWrapper): Promise<void> {
    await wrapper.find('[data-test="card-delete"]').trigger('click');
    await nextTick();
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Events/Index delete (Task 4)', () => {
    it('delete dari card → modal konfirmasi terbuka', async () => {
        const wrapper = mountIndex();
        try {
            await openDeleteModal(wrapper);
            expect(confirmButton(wrapper).exists()).toBe(true);
            expect(routerDeleteMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('confirm → router.delete + tombol confirm terkunci (loading)', async () => {
        const wrapper = mountIndex();
        try {
            await openDeleteModal(wrapper);
            await confirmButton(wrapper).trigger('click');
            await nextTick();

            expect(routerDeleteMock).toHaveBeenCalledTimes(1);
            const btn = confirmButton(wrapper);
            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
        } finally {
            wrapper.unmount();
        }
    });

    it('sukses → modal tutup + target dibersihkan, tanpa toast manual ganda', async () => {
        const wrapper = mountIndex();
        try {
            await openDeleteModal(wrapper);
            await confirmButton(wrapper).trigger('click');
            await nextTick();
            const options = lastDeleteOptions();
            options.onSuccess?.();
            options.onFinish?.();
            await nextTick();

            expect(wrapper.find('[data-test="confirm"]').exists()).toBe(false);
            expect(toast.success).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → handleInertiaFormErrors + modal tetap buka + flag pulih setelah finish', async () => {
        const wrapper = mountIndex();
        try {
            await openDeleteModal(wrapper);
            await confirmButton(wrapper).trigger('click');
            await nextTick();
            const options = lastDeleteOptions();
            options.onError?.({ title: 'Gagal' });
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { title: 'Gagal' },
                { title: 'Gagal menghapus acara' }
            );
            expect(confirmButton(wrapper).exists()).toBe(true);

            options.onFinish?.();
            await nextTick();
            expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
        } finally {
            wrapper.unmount();
        }
    });
});
