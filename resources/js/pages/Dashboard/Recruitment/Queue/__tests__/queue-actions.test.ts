import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import QueueShow from '../Show.vue';
import { toast } from 'vue-sonner';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 5: aksi antrean (axios) —
 * saat sibuk: CometSpinner 16px inline + teks 'Memproses...' + disabled + aria-busy="true";
 * sukses → toast sukses; 404 kosong → toast info + refresh; gagal → toast error + tombol pulih;
 * klik ganda → satu request.
 */

const { axiosPostMock, axiosGetMock } = vi.hoisted(() => ({
    axiosPostMock: vi.fn(),
    axiosGetMock: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        post: axiosPostMock,
        get: axiosGetMock,
        isAxiosError: (error: unknown): boolean =>
            typeof error === 'object' && error !== null && (error as Record<string, unknown>).isAxiosError === true,
    },
}));

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

interface QueueApplication {
    id: string;
    full_name: string;
    registration_number: string;
}

interface QueueEntry {
    id: string;
    queue_number: number;
    status: string;
    status_label: string;
    called_at: string | null;
    completed_at: string | null;
    application: QueueApplication | null;
}

interface QueueSnapshot {
    entries: QueueEntry[];
    current: QueueEntry | null;
    next: QueueEntry | null;
    stats: { waiting: number; called: number; completed: number; total: number };
}

function makeEntry(partial: Partial<QueueEntry> & { id: string }): QueueEntry {
    return {
        queue_number: 1,
        status: 'waiting',
        status_label: 'Menunggu',
        called_at: null,
        completed_at: null,
        application: { id: 'ap-1', full_name: 'Budi Santoso', registration_number: 'REG-001' },
        ...partial,
    };
}

const baseQueue: QueueSnapshot = {
    entries: [
        makeEntry({ id: 'qe-1', queue_number: 1, status: 'called', status_label: 'Dipanggil' }),
        makeEntry({
            id: 'qe-2',
            queue_number: 2,
            application: { id: 'ap-2', full_name: 'Siti Aminah', registration_number: 'REG-002' },
        }),
    ],
    current: makeEntry({ id: 'qe-1', queue_number: 1, status: 'called', status_label: 'Dipanggil' }),
    next: makeEntry({
        id: 'qe-2',
        queue_number: 2,
        application: { id: 'ap-2', full_name: 'Siti Aminah', registration_number: 'REG-002' },
    }),
    stats: { waiting: 1, called: 1, completed: 0, total: 2 },
};

const postHeaders = {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
};

function mountShow(): VueWrapper {
    return mount(QueueShow, {
        props: {
            session: {
                id: 'ses-1',
                session_date: '2026-10-01',
                starts_at: '09:00',
                ends_at: '12:00',
                location: 'Gedung A',
                room: 'Ruang 1',
                division: { name: 'Divisi A' },
                period: { name: 'Gelombang 1' },
            },
            queue: baseQueue,
            pollUrl: '/queue/poll',
            callNextUrl: '/queue/call-next',
            completeUrlTemplate: '/queue/entries/__ENTRY__/complete',
            canManage: true,
        },
    }) as unknown as VueWrapper;
}

function findButton(wrapper: VueWrapper, label: string): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.text().includes(label) || b.text().includes('Memproses...'));
    if (!found) throw new Error(`tombol (${label}) tidak ditemukan`);
    return found as DOMWrapper<HTMLButtonElement>;
}

async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i += 1) {
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 0);
        });
    }
    await nextTick();
}

let resolvePost: ((value: unknown) => void) | null = null;

function mockPostDeferred(): void {
    resolvePost = null;
    axiosPostMock.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                resolvePost = resolve as (value: unknown) => void;
            })
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    resolvePost = null;
    axiosGetMock.mockResolvedValue({ data: baseQueue });
});

describe('Queue/Show aksi antrean (Task 5)', () => {
    it('klik Panggil berikutnya → sibuk (spinner + Memproses... + disabled + aria-busy) + POST tunggal', async () => {
        const wrapper = mountShow();
        try {
            mockPostDeferred();
            const btn = findButton(wrapper, 'Panggil berikutnya');
            await btn.trigger('click');
            await nextTick();

            expect(axiosPostMock).toHaveBeenCalledTimes(1);
            expect(axiosPostMock.mock.calls[0]?.[0]).toBe('/queue/call-next');
            expect(axiosPostMock.mock.calls[0]?.[1]).toEqual({});
            expect(axiosPostMock.mock.calls[0]?.[2]).toEqual(postHeaders);

            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
            expect(btn.find('[role="status"]').exists()).toBe(true);
            expect(btn.text()).toContain('Memproses...');
        } finally {
            resolvePost?.({ data: { queue: baseQueue, message: 'ok' } });
            await flushPromises();
            wrapper.unmount();
        }
    });

    it('sukses → toast sukses + tombol pulih', async () => {
        const wrapper = mountShow();
        try {
            axiosPostMock.mockResolvedValueOnce({
                data: { queue: baseQueue, message: 'Panggilan ok' },
            });
            const btn = findButton(wrapper, 'Panggil berikutnya');
            await btn.trigger('click');
            await flushPromises();

            expect(toast.success).toHaveBeenCalledWith('Panggilan ok');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('false');
            expect(btn.find('[role="status"]').exists()).toBe(false);
            expect(btn.text()).toContain('Panggil berikutnya');
        } finally {
            wrapper.unmount();
        }
    });

    it('404 antrean kosong → toast info + refresh + tombol pulih', async () => {
        const wrapper = mountShow();
        try {
            axiosPostMock.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
            const btn = findButton(wrapper, 'Panggil berikutnya');
            await btn.trigger('click');
            await flushPromises();

            expect(toast.info).toHaveBeenCalledWith('Tidak ada antrean menunggu.');
            expect(axiosGetMock).toHaveBeenCalledWith('/queue/poll', postHeaders);
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.find('[role="status"]').exists()).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal lain → toast error + tombol pulih', async () => {
        const wrapper = mountShow();
        try {
            axiosPostMock.mockRejectedValueOnce(new Error('Network Error'));
            const btn = findButton(wrapper, 'Panggil berikutnya');
            await btn.trigger('click');
            await flushPromises();

            expect(toast.error).toHaveBeenCalledWith('Gagal memanggil antrean berikutnya.');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.find('[role="status"]').exists()).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });

    it('klik ganda saat sibuk → hanya satu request', async () => {
        const wrapper = mountShow();
        try {
            mockPostDeferred();
            const btn = findButton(wrapper, 'Panggil berikutnya');
            await btn.trigger('click');
            await nextTick();
            await btn.trigger('click');
            await nextTick();

            expect(axiosPostMock).toHaveBeenCalledTimes(1);
        } finally {
            resolvePost?.({ data: { queue: baseQueue, message: 'ok' } });
            await flushPromises();
            wrapper.unmount();
        }
    });

    it('Tandai selesai → POST complete + toast sukses + tombol pulih', async () => {
        const wrapper = mountShow();
        try {
            axiosPostMock.mockResolvedValueOnce({
                data: { queue: baseQueue, message: 'Selesai ok' },
            });
            const btn = findButton(wrapper, 'Tandai selesai');
            await btn.trigger('click');
            await flushPromises();

            expect(axiosPostMock).toHaveBeenCalledTimes(1);
            expect(axiosPostMock.mock.calls[0]?.[0]).toBe('/queue/entries/qe-1/complete');
            expect(toast.success).toHaveBeenCalledWith('Selesai ok');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.find('[role="status"]').exists()).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });
});
