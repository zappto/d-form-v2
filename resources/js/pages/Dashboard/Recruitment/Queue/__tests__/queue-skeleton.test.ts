import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { nextTick, defineComponent } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import QueueShow from '../Show.vue';
import QueueDisplay from '@/pages/OpenRecruitment/QueueDisplay.vue';
import SessionQueueDrawer from '@/components/modules/dashboard/recruitment/SessionQueueDrawer.vue';
import { useRecruitmentQueue, type QueueEntryRow, type QueueSnapshot } from '@/hooks/useRecruitmentQueue';
import { showErrorToast } from '@/lib/error-message';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5/§4.2, M2 Task 5 (pola Task 1): skeleton polling antrean —
 * tick 1 (refresh pertama) → skeleton; tick 2+ → update diam tanpa skeleton;
 * gagal → error toast throttled (sekali per transisi) + list lama bertahan,
 * tidak pernah skeleton-forever. M1 Task 5 (tombol Memproses + toast aksi)
 * tidak disentuh — dikunci suite queue-actions.
 */

const { axiosGetMock } = vi.hoisted(() => ({ axiosGetMock: vi.fn() }));

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
        get: axiosGetMock,
        isAxiosError: () => false,
    },
}));

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));
vi.mock('@/layouts/LandingLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

interface QueueApi {
    // Refs setup kembali ter-unwrap di vm proxy.
    queue: QueueSnapshot;
    isInitialLoading: boolean;
    refresh: () => Promise<void>;
}

const QueueHarness = defineComponent({
    props: {
        pollUrl: { type: String, required: true },
        initial: { type: Object, required: true },
    },
    setup(props) {
        return useRecruitmentQueue(props.pollUrl, props.initial as QueueSnapshot);
    },
    template: '<div />',
});

function mountHarness(initial: QueueSnapshot): VueWrapper<InstanceType<typeof QueueHarness>> {
    return mount(QueueHarness, {
        props: { pollUrl: '/queue/poll', initial },
    });
}

function harnessApi(wrapper: VueWrapper): QueueApi {
    return wrapper.vm as unknown as QueueApi;
}

function demoEntry(id: string, queueNumber: number, status: string, name: string): QueueEntryRow {
    return {
        id,
        queue_number: queueNumber,
        status,
        status_label: status,
        called_at: null,
        completed_at: null,
        application: { id: `ap-${id}`, full_name: name, registration_number: `REG-${id}` },
    };
}

function demoSnapshot(): QueueSnapshot {
    return {
        entries: [demoEntry('qe-1', 1, 'called', 'Budi Santoso'), demoEntry('qe-2', 2, 'waiting', 'Siti Aminah')],
        current: demoEntry('qe-1', 1, 'called', 'Budi Santoso'),
        next: demoEntry('qe-2', 2, 'waiting', 'Siti Aminah'),
        stats: { waiting: 1, called: 1, completed: 0, total: 2 },
    };
}

function emptySnapshot(): QueueSnapshot {
    return {
        entries: [],
        current: null,
        next: null,
        stats: { waiting: 0, called: 0, completed: 0, total: 0 },
    };
}

async function flushPromises(): Promise<void> {
    for (let i = 0; i < 5; i += 1) {
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 0);
        });
    }
    await nextTick();
}

let resolveGet: ((value: unknown) => void) | null = null;

function mockGetDeferred(): void {
    resolveGet = null;
    axiosGetMock.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                resolveGet = resolve as (value: unknown) => void;
            })
    );
}

function resolveGetWith(data: unknown): Promise<void> {
    resolveGet?.({ data });
    resolveGet = null;
    return flushPromises();
}

function mountQueueShow(queue: QueueSnapshot): VueWrapper<InstanceType<typeof QueueShow>> {
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
            queue,
            pollUrl: '/queue/poll',
            callNextUrl: '/queue/call-next',
            completeUrlTemplate: '/queue/entries/__ENTRY__/complete',
            canManage: true,
        },
    });
}

function mountDisplay(snapshot: Record<string, unknown>): VueWrapper<InstanceType<typeof QueueDisplay>> {
    return mount(QueueDisplay, {
        props: { snapshot, pollUrl: '/display/poll' },
        global: {
            stubs: {
                SearchableSelect: true,
                Badge: true,
            },
        },
    });
}

function demoDisplaySnapshot(): Record<string, unknown> {
    return {
        session: { name: 'Sesi Pagi', division: 'Divisi A', room: 'Ruang 1', time: '09:00–12:00' },
        entries: [
            {
                queue_number: 1,
                display_name: 'Budi Santoso',
                division: 'Divisi A',
                room: 'Ruang 1',
                status: 'called',
                status_label: 'Dipanggil',
            },
            {
                queue_number: 2,
                display_name: 'Siti Aminah',
                division: 'Divisi B',
                room: 'Ruang 2',
                status: 'waiting',
                status_label: 'Menunggu',
            },
        ],
        current: { queue_number: 1, display_name: 'Budi Santoso', division: 'Divisi A', status: 'called' },
        next: { queue_number: 2, display_name: 'Siti Aminah', division: 'Divisi B', status: 'waiting' },
        stats: { waiting: 1, called: 1, completed: 0, total: 2 },
    };
}

function mountDrawer(): VueWrapper<InstanceType<typeof SessionQueueDrawer>> {
    return mount(SessionQueueDrawer, {
        props: { pollUrl: '/queue/poll', sessionDate: '2026-10-01', division: 'Divisi A' },
        global: {
            stubs: {
                SheetHeader: true,
                SheetTitle: true,
                SheetDescription: true,
                SheetFooter: true,
            },
        },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    axiosGetMock.mockReset();
    resolveGet = null;
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useRecruitmentQueue first-tick (M2 Task 5)', () => {
    it('awal → isInitialLoading true + antrean awal dipakai', () => {
        const wrapper = mountHarness(emptySnapshot());
        try {
            expect(harnessApi(wrapper).isInitialLoading).toBe(true);
            expect(harnessApi(wrapper).queue.entries).toHaveLength(0);
        } finally {
            wrapper.unmount();
        }
    });

    it('tick 1 sukses → antrean terisi + loading selesai', async () => {
        const wrapper = mountHarness(emptySnapshot());
        try {
            axiosGetMock.mockResolvedValueOnce({ data: demoSnapshot() });
            await harnessApi(wrapper).refresh();

            expect(harnessApi(wrapper).queue.entries).toHaveLength(2);
            expect(harnessApi(wrapper).isInitialLoading).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });

    it('tick 2+ → update diam, loading tetap false', async () => {
        const wrapper = mountHarness(emptySnapshot());
        try {
            axiosGetMock.mockResolvedValueOnce({ data: demoSnapshot() });
            await harnessApi(wrapper).refresh();

            const second = demoSnapshot();
            second.stats.waiting = 5;
            axiosGetMock.mockResolvedValueOnce({ data: second });
            await harnessApi(wrapper).refresh();

            expect(harnessApi(wrapper).queue.stats.waiting).toBe(5);
            expect(harnessApi(wrapper).isInitialLoading).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → toast sekali (throttled) + antrean lama bertahan + loading selesai', async () => {
        const wrapper = mountHarness(demoSnapshot());
        try {
            axiosGetMock.mockResolvedValueOnce({ data: demoSnapshot() });
            await harnessApi(wrapper).refresh();

            axiosGetMock.mockRejectedValueOnce(new Error('mati'));
            await harnessApi(wrapper).refresh();
            axiosGetMock.mockRejectedValueOnce(new Error('mati lagi'));
            await harnessApi(wrapper).refresh();

            expect(harnessApi(wrapper).queue.entries).toHaveLength(2);
            expect(harnessApi(wrapper).isInitialLoading).toBe(false);
            expect(showErrorToast).toHaveBeenCalledTimes(1);
            expect(showErrorToast).toHaveBeenCalledWith('Gagal memperbarui antrean. Menampilkan data terakhir.');

            // Sukses mereset throttle: gagal berikutnya toast lagi.
            axiosGetMock.mockResolvedValueOnce({ data: demoSnapshot() });
            await harnessApi(wrapper).refresh();
            axiosGetMock.mockRejectedValueOnce(new Error('mati'));
            await harnessApi(wrapper).refresh();
            expect(showErrorToast).toHaveBeenCalledTimes(2);
        } finally {
            wrapper.unmount();
        }
    });

    it('interval 10s memicu refresh diam; unmount menghentikan poll', async () => {
        vi.useFakeTimers();
        const wrapper = mountHarness(emptySnapshot());
        try {
            axiosGetMock.mockResolvedValue({ data: demoSnapshot() });
            await vi.advanceTimersByTimeAsync(10_000);
            expect(axiosGetMock).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(10_000);
            expect(axiosGetMock).toHaveBeenCalledTimes(2);

            wrapper.unmount();
            await vi.advanceTimersByTimeAsync(30_000);
            expect(axiosGetMock).toHaveBeenCalledTimes(2);
        } finally {
            if (wrapper.exists()) wrapper.unmount();
            vi.useRealTimers();
        }
    });
});

describe('Queue/Show skeleton (M2 Task 5)', () => {
    it('awal kosong + tick menggantung → skeleton (4 stat + 2 kartu + 6 baris) + kontrol tampil', async () => {
        mockGetDeferred();
        const wrapper = mountQueueShow(emptySnapshot());
        try {
            await nextTick();

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            expect(wrapper.findAll('.queue-stat-skeleton')).toHaveLength(4);
            expect(wrapper.findAll('.queue-card-skeleton')).toHaveLength(2);
            expect(wrapper.findAll('.queue-row-skeleton')).toHaveLength(6);

            // Kontrol panggil tetap terlihat; baris asli belum ada.
            expect(wrapper.text()).toContain('Panggil berikutnya');
            expect(wrapper.text()).not.toContain('Budi Santoso');
        } finally {
            await resolveGetWith(demoSnapshot());
            wrapper.unmount();
        }
    });

    it('tick 1 sukses → konten fade-up, skeleton hilang', async () => {
        mockGetDeferred();
        const wrapper = mountQueueShow(emptySnapshot());
        try {
            await resolveGetWith(demoSnapshot());

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('props terisi → konten langsung, tanpa skeleton (kompatibel M1)', async () => {
        axiosGetMock.mockResolvedValue({ data: demoSnapshot() });
        const wrapper = mountQueueShow(demoSnapshot());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            await flushPromises();
        } finally {
            wrapper.unmount();
        }
    });

    it('poll gagal → toast + list lama bertahan, tanpa skeleton-forever', async () => {
        axiosGetMock.mockRejectedValue(new Error('mati'));
        const wrapper = mountQueueShow(demoSnapshot());
        try {
            await flushPromises();

            expect(showErrorToast).toHaveBeenCalledTimes(1);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('QueueDisplay skeleton (M2 Task 5)', () => {
    it('snapshot kosong + tick menggantung → hero + list skeleton, filter tetap', async () => {
        mockGetDeferred();
        const wrapper = mountDisplay({});
        try {
            await nextTick();

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            expect(wrapper.find('.display-hero-skeleton').exists()).toBe(true);
            expect(wrapper.findAll('.display-row-skeleton')).toHaveLength(6);

            expect(wrapper.find('[aria-label="Filter divisi"]').exists()).toBe(true);
            expect(wrapper.find('[aria-label="Filter ruang"]').exists()).toBe(true);
            expect(wrapper.find('[aria-label="Filter status"]').exists()).toBe(true);
        } finally {
            await resolveGetWith(demoDisplaySnapshot());
            wrapper.unmount();
        }
    });

    it('tick 1 sukses → konten fade-up, skeleton hilang', async () => {
        mockGetDeferred();
        const wrapper = mountDisplay({});
        try {
            await resolveGetWith(demoDisplaySnapshot());

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('props terisi → konten langsung, tanpa skeleton', async () => {
        axiosGetMock.mockResolvedValue({ data: demoDisplaySnapshot() });
        const wrapper = mountDisplay(demoDisplaySnapshot());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            await flushPromises();
        } finally {
            wrapper.unmount();
        }
    });

    it('poll gagal → banner error bertahan + data lama tampil', async () => {
        axiosGetMock.mockRejectedValue(new Error('mati'));
        const wrapper = mountDisplay(demoDisplaySnapshot());
        try {
            await flushPromises();

            expect(wrapper.text()).toContain('Gagal memperbarui antrean');
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('SessionQueueDrawer skeleton (M2 Task 5)', () => {
    it('tick 1 menggantung → skeleton (4 stat + 1 current + 6 baris), tanpa Loader2', async () => {
        mockGetDeferred();
        const wrapper = mountDrawer();
        try {
            await nextTick();

            expect(wrapper.find('[aria-label="Memuat antrean"]').exists()).toBe(true);
            expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);

            expect(wrapper.findAll('.drawer-stat-skeleton')).toHaveLength(4);
            expect(wrapper.find('.drawer-current-skeleton').exists()).toBe(true);
            expect(wrapper.findAll('.drawer-row-skeleton')).toHaveLength(6);

            // Loader2 lama hilang total.
            expect(wrapper.text()).not.toContain('Memuat antrean');
            expect(wrapper.find('.animate-spin').exists()).toBe(false);
            expect(wrapper.text()).toContain('Antrean sesi');
        } finally {
            await resolveGetWith(demoSnapshot());
            wrapper.unmount();
        }
    });

    it('tick 1 sukses → konten + aria-busy false, skeleton hilang', async () => {
        mockGetDeferred();
        const wrapper = mountDrawer();
        try {
            await resolveGetWith(demoSnapshot());

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.find('[aria-busy="false"]').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('tick 2 → update diam tanpa skeleton', async () => {
        vi.useFakeTimers();
        try {
            mockGetDeferred();
            const wrapper = mountDrawer();
            try {
                resolveGet?.({ data: demoSnapshot() });
                await vi.advanceTimersByTimeAsync(0);
                await nextTick();
                expect(wrapper.text()).toContain('Budi Santoso');

                const second = demoSnapshot();
                second.entries = [demoEntry('qe-9', 9, 'waiting', 'Rina Wulandari')];
                second.current = null;
                second.next = demoEntry('qe-9', 9, 'waiting', 'Rina Wulandari');
                axiosGetMock.mockResolvedValue({ data: second });
                await vi.advanceTimersByTimeAsync(10_000);
                await nextTick();

                expect(wrapper.text()).toContain('Rina Wulandari');
                expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            } finally {
                wrapper.unmount();
            }
        } finally {
            vi.useRealTimers();
        }
    });

    it('poll pertama gagal → error toast + tanpa skeleton-forever', async () => {
        axiosGetMock.mockRejectedValueOnce(new Error('mati'));
        const wrapper = mountDrawer();
        try {
            await flushPromises();

            expect(showErrorToast).toHaveBeenCalledTimes(1);
            expect(showErrorToast).toHaveBeenCalledWith('Gagal memperbarui antrean. Menampilkan data terakhir.');
            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Tidak ada antrean menunggu');
        } finally {
            wrapper.unmount();
        }
    });
});
