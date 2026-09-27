import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import MyInterviewsIndex from '../Index.vue';

/** Tipe baris interview diturunkan dari props komponen agar fixture tak menduplikasi bentuk. */
type TInterviewRow = InstanceType<typeof MyInterviewsIndex>['$props']['interviews']['data'][number];

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5, M2 Task 1 (fondasi skeleton): blok loading navigasi memakai
 * `Skeleton.vue` (`data-slot="skeleton"`, `bg-primary/10`) + region
 * `aria-busy`/`aria-label` Indonesia; header/filter tetap terlihat; konten asli
 * tersembunyi saat sibuk dan muncul dengan `.fade-up` setelah selesai.
 * Pola ini disalin M2 Tasks 2–12.
 */

const { routerGetMock } = vi.hoisted(() => ({ routerGetMock: vi.fn() }));

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: {
        post: vi.fn(),
        get: routerGetMock,
        delete: vi.fn(),
        reload: vi.fn(),
        visit: vi.fn(),
    },
    usePage: () => ({
        props: { auth: { user: { can_view_recruitment_queue: false } } },
        url: '/dashboard/recruitment/my-interviews',
    }),
}));

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: {
        props: ['title', 'description'],
        template:
            '<div data-testid="empty-state"><p>{{ title }}</p><p v-if="description">{{ description }}</p><slot /></div>',
    },
}));

interface IRouterGetOptions {
    preserveState?: boolean;
    preserveScroll?: boolean;
    replace?: boolean;
    onStart?: () => void;
    onFinish?: () => void;
}

function lastGetOptions(): IRouterGetOptions {
    expect(routerGetMock).toHaveBeenCalled();
    const options = routerGetMock.mock.calls[0]?.[2] as IRouterGetOptions | undefined;
    expect(options).toBeDefined();
    return options as IRouterGetOptions;
}

function demoRow(): TInterviewRow {
    return {
        interview_id: 'iv-1',
        scheduled_at: null,
        status_label: 'Terjadwal',
        location: 'Gedung A',
        room: 'Ruang 1',
        queue_number: 3,
        needs_evaluation: true,
        has_evaluation: false,
        evaluation_locked: false,
        application: {
            id: 'ap-1',
            full_name: 'Ayu Lestari',
            nim: 'A11.2023.12345',
            registration_number: 'OPREC-2026-00001',
            primary_division: 'Divisi A',
        },
        session: null,
    };
}

function baseProps(data: TInterviewRow[]): InstanceType<typeof MyInterviewsIndex>['$props'] {
    return {
        interviews: {
            data,
            current_page: 1,
            last_page: 1,
            total: data.length,
            per_page: 20,
            from: data.length > 0 ? 1 : null,
            to: data.length > 0 ? data.length : null,
        },
        query: {},
        queue_counts: {},
        today_sessions: [],
        next_action: null,
    };
}

function mountIndex(data: TInterviewRow[] = [demoRow()]): VueWrapper<InstanceType<typeof MyInterviewsIndex>> {
    return mount(MyInterviewsIndex, {
        props: baseProps(data),
        global: {
            stubs: {
                Badge: true,
                Card: true,
                CardContent: true,
                SearchableSelect: true,
                Pagination: true,
                PaginationContent: true,
                PaginationEllipsis: true,
                PaginationItem: true,
                PaginationNext: true,
                PaginationPrevious: true,
            },
        },
    });
}

function skeletonRegion(wrapper: VueWrapper): ReturnType<VueWrapper['find']> {
    return wrapper.find('[aria-busy="true"]');
}

async function startNavigating(wrapper: VueWrapper): Promise<void> {
    vi.useFakeTimers();
    try {
        await wrapper.find('input[type="search"]').setValue('ayu');
        await vi.advanceTimersByTimeAsync(300);
        await nextTick();
    } finally {
        vi.useRealTimers();
    }
    await nextTick();
}

beforeEach(() => {
    vi.clearAllMocks();
    routerGetMock.mockReset();
    // Cerminkan Inertia: onStart jalan saat request berangkat; onFinish hanya
    // bila test memicunya eksplisit (navigasi "menggantung" seperti throttle nyata).
    routerGetMock.mockImplementation((...args: unknown[]) => {
        const options = args[2] as IRouterGetOptions | undefined;
        options?.onStart?.();
        return undefined;
    });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('MyInterviews/Index skeleton foundation (M2 Task 1)', () => {
    it('ada data + idle → konten muncul dengan fade-up, tanpa skeleton', async () => {
        const wrapper = mountIndex();
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Ayu Lestari');

            const groups = wrapper.findAll('section.fade-up');
            expect(groups.length).toBeGreaterThan(0);
            expect(groups[0]?.text()).toContain('Ayu Lestari');

            // Header/filter tetap di tempat.
            expect(wrapper.find('input[type="search"]').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi filter → skeleton Skeleton.vue tampil + konten asli hidden + header/filter visible', async () => {
        const wrapper = mountIndex();
        try {
            await startNavigating(wrapper);

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = skeletonRegion(wrapper);
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            const skeletons = wrapper.findAll('[data-slot="skeleton"]');
            expect(skeletons.length).toBeGreaterThan(0);

            expect(wrapper.text()).not.toContain('Ayu Lestari');

            // Header/filter tidak ikut hilang.
            expect(wrapper.find('input[type="search"]').exists()).toBe(true);
            expect(wrapper.text()).toContain('hasil');
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi selesai → skeleton hilang + konten fade-up kembali', async () => {
        const wrapper = mountIndex();
        try {
            await startNavigating(wrapper);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

            lastGetOptions().onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Ayu Lestari');
            expect(wrapper.findAll('section.fade-up').length).toBeGreaterThan(0);
        } finally {
            wrapper.unmount();
        }
    });

    it('props kosong + idle → tanpa skeleton dan tanpa kartu (empty state)', async () => {
        const wrapper = mountIndex([]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).not.toContain('Ayu Lestari');
            expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
            expect(routerGetMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });
});
