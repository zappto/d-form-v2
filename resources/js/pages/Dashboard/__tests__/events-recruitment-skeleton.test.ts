import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import EventsIndex from '../Events/Index.vue';
import RecruitmentIndex from '../Recruitment/Index.vue';
import EventCard from '@/components/modules/dashboard/events/EventCard.vue';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5, M2 Task 2 (pola Task 1): skeleton navigasi memakai `Skeleton.vue`
 * (`data-slot="skeleton"`) + region `aria-busy`/`aria-label` Indonesia;
 * header/filter/paginasi tetap terlihat; konten asli hidden saat sibuk dan
 * muncul dengan `.fade-up` setelah selesai.
 * - Events/Index: flag `isLoadingEvents` baru (onStart/onFinish partial visit);
 *   8 `.event-card-skeleton` sejajar grid + EventCard.
 * - Recruitment/Index: flag `isLoadingPeriods` baru; cermin layout aktual —
 *   3 `.queue-skeleton`, 6 `.period-card-skeleton`, 2 `.session-skeleton`,
 *   2 `.quick-skeleton` (bukan "3 stat + 6 konten" versi spec).
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
        props: {
            auth: {
                user: {
                    can_manage_events: false,
                    can_manage_recruitment_periods: true,
                    can_schedule_recruitment_interviews: true,
                    can_view_recruitment_queue: false,
                },
            },
        },
        url: '/dashboard',
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

interface RouterGetOptions {
    preserveState?: boolean;
    preserveScroll?: boolean;
    replace?: boolean;
    only?: string[];
    onStart?: () => void;
    onFinish?: () => void;
}

function lastGetOptions(): RouterGetOptions {
    expect(routerGetMock).toHaveBeenCalled();
    const options = routerGetMock.mock.calls[0]?.[2] as RouterGetOptions | undefined;
    expect(options).toBeDefined();
    return options as RouterGetOptions;
}

function demoIEvent(id: string, title: string): IEvent {
    return {
        id,
        slug: `acara-${id}`,
        title,
        description: 'Deskripsi',
        start_date: '2026-10-01',
        end_date: '2026-10-02',
        registration_start: '2026-09-01',
        registration_end: '2026-09-30',
        location: 'Kampus',
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
}

function mountEventsIndex(events: IEvent[], lastPage: number): VueWrapper<InstanceType<typeof EventsIndex>> {
    return mount(EventsIndex, {
        props: {
            events: {
                data: events,
                current_page: 1,
                last_page: lastPage,
                per_page: 12,
                total: events.length,
                from: events.length > 0 ? 1 : null,
                to: events.length > 0 ? events.length : null,
            },
            filterOptions: { categories: [], sessions: [], statuses: [] },
            query: {},
        },
        global: {
            stubs: {
                EventFilterBar: true,
                EventCard: true,
                ConfirmationModal: true,
            },
        },
    });
}

function nextPageButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.text().includes('Berikutnya'));
    if (!found) throw new Error('tombol Berikutnya tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
}

/** Tipe props diturunkan dari komponen agar fixture tak menduplikasi bentuk. */
type TRecruitmentIndexProps = InstanceType<typeof RecruitmentIndex>['$props'];
type TRecruitmentSummary = TRecruitmentIndexProps['summary'];
type TPeriodRow = NonNullable<TRecruitmentIndexProps['periods']>['data'][number];
type TActionQueue = NonNullable<TRecruitmentSummary['action_queues']>[number];
type TTodaySession = NonNullable<TRecruitmentSummary['today_sessions']>[number];

function demoPeriod(id: string, name: string): TPeriodRow {
    return {
        id,
        name,
        slug: `periode-${id}`,
        status: 'open',
        status_label: 'Buka',
        banner_url: null,
        registration_opens_at: null,
        registration_closes_at: null,
        applications_count: 5,
        creator: null,
        can_edit: false,
        can_delete: false,
    };
}

function demoSummary(queues: TActionQueue[], sessions: TTodaySession[]): TRecruitmentSummary {
    return {
        active_period: { id: 'per-1', name: 'Gelombang 1', status: 'open', status_label: 'Buka' },
        stats: {},
        action_queues: queues,
        today_sessions: sessions,
    };
}

function demoQueue(key: string): TActionQueue {
    return { key, label: `Antrean ${key}`, description: 'Deskripsi antrean', count: 2 };
}

function demoSession(): TTodaySession {
    return {
        id: 'ses-1',
        session_date: '2026-10-01',
        starts_at: '09:00',
        ends_at: '12:00',
        location: 'Gedung A',
        room: 'Ruang 1',
        interviews_count: 3,
        division: null,
    };
}

function mountRecruitmentIndex(
    periods: TPeriodRow[],
    queues: TActionQueue[],
    sessions: TTodaySession[]
): VueWrapper<InstanceType<typeof RecruitmentIndex>> {
    return mount(RecruitmentIndex, {
        props: {
            summary: demoSummary(queues, sessions),
            periods: {
                data: periods,
                current_page: 1,
                last_page: 1,
                total: periods.length,
                per_page: 20,
            },
            query: {},
            statusOptions: [],
            divisions: [],
        },
        global: {
            stubs: {
                Badge: true,
                Button: true,
                Card: true,
                CardContent: true,
                SearchableSelect: true,
                DivisionListSheet: true,
                ConfirmationModal: true,
            },
        },
    });
}

async function typePeriodSearch(wrapper: VueWrapper, text: string): Promise<void> {
    await wrapper.find('input').setValue(text);
    await nextTick();
}

beforeEach(() => {
    vi.clearAllMocks();
    routerGetMock.mockReset();
    // Cerminkan Inertia: onStart jalan saat request berangkat; onFinish hanya
    // bila test memicunya eksplisit (navigasi "menggantung" seperti throttle nyata).
    routerGetMock.mockImplementation((...args: unknown[]) => {
        const options = args[2] as RouterGetOptions | undefined;
        options?.onStart?.();
        return undefined;
    });
});

describe('Events/Index grid skeleton (M2 Task 2)', () => {
    it('ada data + idle → grid EventCard fade-up, tanpa skeleton', async () => {
        const wrapper = mountEventsIndex([demoIEvent('ev-1', 'Acara A')], 1);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.findAllComponents(EventCard)).toHaveLength(1);
            expect(wrapper.find('.fade-up').exists()).toBe(true);
            expect(wrapper.text()).toContain('Buat acara');
        } finally {
            wrapper.unmount();
        }
    });

    it('pindah halaman → tepat 8 skeleton kartu + konten hidden + header visible', async () => {
        const wrapper = mountEventsIndex([demoIEvent('ev-1', 'Acara A')], 2);
        try {
            await nextPageButton(wrapper).trigger('click');
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            const cards = wrapper.findAll('.event-card-skeleton');
            expect(cards).toHaveLength(8);
            for (const card of cards) {
                expect(card.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            }

            expect(wrapper.findAllComponents(EventCard)).toHaveLength(0);

            // Header filter + aksi + paginasi tidak ikut hilang.
            expect(wrapper.text()).toContain('Buat acara');
            expect(wrapper.text()).toContain('Berikutnya');
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi selesai → skeleton hilang + grid fade-up kembali', async () => {
        const wrapper = mountEventsIndex([demoIEvent('ev-1', 'Acara A')], 2);
        try {
            await nextPageButton(wrapper).trigger('click');
            await nextTick();
            expect(wrapper.findAll('.event-card-skeleton')).toHaveLength(8);

            lastGetOptions().onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.findAllComponents(EventCard)).toHaveLength(1);
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('events kosong + idle → empty state, tanpa skeleton/request', async () => {
        const wrapper = mountEventsIndex([], 1);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
            expect(routerGetMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Recruitment/Index skeleton (M2 Task 2)', () => {
    it('ada data + idle → konten fade-up, tanpa skeleton', async () => {
        const wrapper = mountRecruitmentIndex(
            [demoPeriod('per-1', 'Gelombang 1')],
            [demoQueue('screening'), demoQueue('interview')],
            [demoSession()]
        );
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Gelombang 1');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('filter periode → cermin layout aktual (3 antrean + 6 periode + 2 sesi) + konten hidden', async () => {
        const wrapper = mountRecruitmentIndex(
            [demoPeriod('per-1', 'Gelombang 1')],
            [demoQueue('screening'), demoQueue('interview')],
            [demoSession()]
        );
        try {
            await typePeriodSearch(wrapper, 'gelombang');
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            expect(wrapper.findAll('.queue-skeleton')).toHaveLength(3);
            expect(wrapper.findAll('.period-card-skeleton')).toHaveLength(6);
            expect(wrapper.findAll('.session-skeleton')).toHaveLength(2);
            // Antrean tak kosong → zona akses cepat tidak tampil.
            expect(wrapper.findAll('.quick-skeleton')).toHaveLength(0);

            expect(wrapper.text()).not.toContain('Gelombang 1');

            // Baris filter tetap terlihat.
            expect(wrapper.find('input').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('antrean kosong → skeleton akses cepat 2 kartu, tanpa skeleton antrean', async () => {
        const wrapper = mountRecruitmentIndex([demoPeriod('per-1', 'Gelombang 1')], [], []);
        try {
            await typePeriodSearch(wrapper, 'gelombang');
            await nextTick();

            expect(wrapper.findAll('.quick-skeleton')).toHaveLength(2);
            expect(wrapper.findAll('.queue-skeleton')).toHaveLength(0);
            expect(wrapper.findAll('.session-skeleton')).toHaveLength(0);
            expect(wrapper.findAll('.period-card-skeleton')).toHaveLength(6);
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi selesai → skeleton hilang + konten fade-up kembali', async () => {
        const wrapper = mountRecruitmentIndex(
            [demoPeriod('per-1', 'Gelombang 1')],
            [demoQueue('screening')],
            [demoSession()]
        );
        try {
            await typePeriodSearch(wrapper, 'gelombang');
            await nextTick();
            expect(wrapper.findAll('.period-card-skeleton')).toHaveLength(6);

            lastGetOptions().onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Gelombang 1');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });
});
