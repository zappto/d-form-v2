import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import PeriodsEdit from '../Periods/Edit.vue';
import PeriodsShow from '../Periods/Show.vue';
import QueueIndexPage from '@/pages/OpenRecruitment/QueueIndex.vue';
import AttendancePage from '@/pages/OpenRecruitment/Attendance.vue';
import TrackEdit from '@/pages/OpenRecruitment/Track/Edit.vue';
import { Tabs } from '@/components/ui/tabs';

/** Tipe props diturunkan dari komponen agar fixture tak menduplikasi bentuk. */
type TPeriodsShowProps = InstanceType<typeof PeriodsShow>['$props'];
type TPeriodsEditProps = InstanceType<typeof PeriodsEdit>['$props'];
type TQueueIndexProps = InstanceType<typeof QueueIndexPage>['$props'];
type TAttendanceProps = InstanceType<typeof AttendancePage>['$props'];
type TTrackEditProps = InstanceType<typeof TrackEdit>['$props'];

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5/§7.2, M2 Task 12 FINAL (pola Task 1): skeleton missing-props +
 * tab parsial — tombol save M1 + tabel/panel M2 Task 4 tak disentuh.
 * - Periods/Edit: readiness skeleton (field + save placeholder).
 * - Show tabs: flag `isLoadingTab` + cabang per tab aktif (interview/laporan/
 *   interviewer); visit dipertahankan; tab lain tak berkedip (unmount).
 * - QueueIndex/Attendance/Track/Edit: missing-props guards.
 */

const { routerGetMock } = vi.hoisted(() => ({
    routerGetMock: vi.fn<(url: string, data?: Record<string, string>, options?: IRouterGetOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
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
                        can_list_recruitment_applications: true,
                        can_schedule_recruitment_interviews: true,
                        can_screen_recruitment_applications: true,
                        can_view_recruitment_reports: true,
                        can_manage_recruitment_periods: true,
                        can_review_recruitment_corrections: false,
                        can_decide_recruitment_final: false,
                    },
                },
            },
            url: '/dashboard/recruitment/periods/per-1',
        }),
        useForm: <T extends object>(initial: T) => {
            const errors = reactive<Record<string, string>>({});
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: vi.fn(),
                put: vi.fn(),
                reset: vi.fn(),
                clearErrors: vi.fn(),
                setError: vi.fn(),
                defaults: vi.fn(),
            });
            return state;
        },
    };
});

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));
vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }));
vi.mock('@/layouts/LandingLayout.vue', () => ({ default: { template: '<slot />' } }));
vi.mock('@/layouts/FormFillLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/lib/error-message', () => ({
    humanizeErrorMessage: (message: string): string => message,
}));

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({
        handleInertiaFormErrors: vi.fn(),
        showErrorToast: vi.fn(),
        showFlashToast: vi.fn(),
        showHttpErrorToast: vi.fn(),
        showValidationErrorToast: vi.fn(),
    }),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

interface IRouterGetOptions {
    preserveState?: boolean;
    preserveScroll?: boolean;
    onStart?: () => void;
    onFinish?: () => void;
}

function lastGetOptions(): IRouterGetOptions {
    expect(routerGetMock).toHaveBeenCalled();
    const options = routerGetMock.mock.calls[0]?.[2];
    expect(options).toBeDefined();
    return options as IRouterGetOptions;
}

function switchTab(wrapper: VueWrapper, value: string): Promise<void> {
    const tabs = wrapper.findComponent(Tabs);
    if (!tabs.exists()) throw new Error('komponen Tabs tidak ditemukan');
    tabs.vm.$emit('update:modelValue', value);
    return nextTick();
}

type TEditPeriod = NonNullable<TPeriodsEditProps['period']>;

function demoPeriod(): TEditPeriod {
    return {
        id: 'per-1',
        name: 'Gelombang 1',
        description: null,
        registration_opens_at: null,
        registration_closes_at: null,
        interview_starts_at: null,
        interview_ends_at: null,
        finalization_deadline_at: null,
        banner_url: null,
    };
}

type TSessionRow = NonNullable<TPeriodsShowProps['sessions']>['data'][number];

function demoSessionRow(): TSessionRow {
    return {
        id: 'ses-1',
        session_date: '2026-10-01',
        starts_at: '09:00',
        ends_at: '12:00',
        location: 'Gedung A',
        room: 'Ruang 1',
        is_active: true,
        interviews_count: 2,
        period: { id: 'per-1', name: 'Gelombang 1' },
        division: { id: 'div-1', name: 'Divisi A', code: 'A' },
    };
}

type TReportPayload = NonNullable<TPeriodsShowProps['report']>;

function demoReport(): TReportPayload {
    return {
        period: { id: 'per-1', name: 'Gelombang 1' },
        funnel: [
            { stage: 'submitted', label: 'Pendaftar', count: 10 },
            { stage: 'screening', label: 'Lolos screening', count: 6 },
        ],
        by_division: [{ division: 'Divisi A', count: 6 }],
        by_semester: [{ semester: 3, count: 6 }],
        interview_stats: {},
        feedback: { count: 0, averages: {} },
    };
}

type TApplicationRow = NonNullable<TPeriodsShowProps['applications']>[number];

function demoApplicantRow(): TApplicationRow {
    return {
        id: 'ap-1',
        registration_number: 'OPREC-2026-00001',
        full_name: 'Budi Santoso',
        nim: 'A11.2023.12345',
        semester: 3,
        stage: 'submitted',
        stage_label: 'Submitted',
        result: 'pending',
        result_label: 'Menunggu',
        revision_required: false,
        submitted_at: null,
        primary_division: { id: 'div-1', name: 'Divisi A' },
        secondary_division: null,
        period: { id: 'per-1', name: 'Gelombang 1' },
    };
}

function baseShowProps(): Omit<TPeriodsShowProps, 'tab'> {
    return {
        period: {
            id: 'per-1',
            name: 'Gelombang 1',
            slug: 'gelombang-1',
            status: 'open',
            status_label: 'Buka',
            description: null,
            registration_opens_at: null,
            registration_closes_at: null,
            interview_starts_at: null,
            interview_ends_at: null,
            finalization_deadline_at: null,
            applications_count: 1,
        },
        applications: [demoApplicantRow()],
        queue_counts: {},
        divisionOptions: [],
        stageOptions: [{ value: 'submitted', label: 'Submitted' }],
        semesterOptions: [],
        query: {},
        sessions: { data: [demoSessionRow()], current_page: 1, last_page: 1, per_page: 20, total: 1 },
        report: demoReport(),
        assignments: [],
        divisions: [],
        interviewerCandidates: [],
    };
}

function mountShow(
    tab: string,
    interviewStub: boolean,
    reportStub: boolean
): VueWrapper<InstanceType<typeof PeriodsShow>> {
    const props: TPeriodsShowProps = { ...baseShowProps(), tab };
    return mount(PeriodsShow, {
        props,
        global: {
            stubs: {
                PeriodApplicantSection: true,
                PeriodInterviewSection: interviewStub,
                PeriodReportSection: reportStub,
                ApplicantDetailPanel: true,
                ConfirmationModal: true,
                InterviewerCreateSheet: true,
                SearchableSelect: true,
                Avatar: true,
                AvatarFallback: true,
                Tooltip: true,
                TooltipContent: true,
                TooltipProvider: true,
                TooltipTrigger: true,
                Badge: true,
                Button: true,
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                Label: true,
                CometSpinner: true,
            },
        },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    routerGetMock.mockReset();
    routerGetMock.mockImplementation((url, data, options) => {
        options?.onStart?.();
    });
});

describe('Periods/Edit skeleton (M2 Task 12)', () => {
    function mountEdit(period: TPeriodsEditProps['period']): VueWrapper<InstanceType<typeof PeriodsEdit>> {
        return mount(PeriodsEdit, {
            props: { period },
            global: {
                stubs: {
                    Button: true,
                    CometSpinner: true,
                    Input: true,
                    Label: true,
                    Card: true,
                    CardContent: true,
                    DatePicker: true,
                    SplitDateTimeField: true,
                },
            },
        });
    }

    it('props lengkap → form + tombol M1 utuh, tanpa skeleton', async () => {
        const wrapper = mountEdit(demoPeriod());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Edit periode');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('period belum ada → skeleton field + save, tanpa crash', async () => {
        const wrapper = mountEdit(undefined);
        try {
            await nextTick();

            const regions = wrapper.findAll('[aria-busy="true"]');
            expect(regions.length).toBeGreaterThan(0);
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);
            }

            expect(wrapper.findAll('.edit-field-skeleton')).toHaveLength(8);
            expect(wrapper.find('.edit-save-skeleton').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Show tab interview skeleton (M2 Task 12)', () => {
    it('tab interview terisi → konten + fade-up, tanpa skeleton', async () => {
        const wrapper = mountShow('interview', false, true);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('2026-10-01');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('pindah tab → hanya seksi aktif skeleton (6 baris), tab lain tak berkedip', async () => {
        const wrapper = mountShow('interview', false, true);
        try {
            await switchTab(wrapper, 'laporan');
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);

            expect(wrapper.findAll('.interview-row-skeleton')).toHaveLength(6);
            expect(wrapper.text()).not.toContain('2026-10-01');
            // Tab laporan tak ter-mount → tak berkedip.
            expect(wrapper.text()).not.toContain('Funnel recruitment');
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi selesai → konten kembali + fade-up', async () => {
        const wrapper = mountShow('interview', false, true);
        try {
            await switchTab(wrapper, 'laporan');
            await nextTick();
            expect(wrapper.findAll('.interview-row-skeleton')).toHaveLength(6);

            lastGetOptions().onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('2026-10-01');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Show tab laporan skeleton (M2 Task 12)', () => {
    it('tab laporan terisi → konten + fade-up, tanpa skeleton', async () => {
        const wrapper = mountShow('laporan', true, false);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Funnel recruitment');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('pindah tab → skeleton funnel + grid, konten hidden', async () => {
        const wrapper = mountShow('laporan', true, false);
        try {
            await switchTab(wrapper, 'peserta');
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);

            expect(wrapper.find('.report-funnel-skeleton').exists()).toBe(true);
            expect(wrapper.findAll('.report-grid-skeleton')).toHaveLength(2);
            expect(wrapper.text()).not.toContain('Funnel recruitment');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Show tab interviewer skeleton (M2 Task 12)', () => {
    it('pindah tab → skeleton form + 6 baris, konten hidden', async () => {
        const wrapper = mountShow('interviewer', true, true);
        try {
            await switchTab(wrapper, 'peserta');
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);

            expect(wrapper.findAll('.interviewer-row-skeleton')).toHaveLength(6);
            expect(wrapper.text()).not.toContain('Tugaskan interviewer');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('QueueIndex skeleton (M2 Task 12)', () => {
    type TQueueSession = NonNullable<TQueueIndexProps['sessions']>[number];

    function mountIndex(sessions: TQueueIndexProps['sessions']): VueWrapper<InstanceType<typeof QueueIndexPage>> {
        return mount(QueueIndexPage, {
            props: { sessions },
            global: {
                stubs: {
                    Badge: true,
                    Button: true,
                    Card: true,
                    CardContent: true,
                },
            },
        });
    }

    function demoQueueSession(): TQueueSession {
        return {
            id: 'ses-1',
            name: 'Sesi Pagi',
            division: 'Divisi A',
            room: 'Ruang 1',
            time: '09:00–12:00',
            board_url: '/board/ses-1',
        };
    }

    it('terisi → daftar fade-up, tanpa skeleton', async () => {
        const wrapper = mountIndex([demoQueueSession()]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Sesi Pagi');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('belum ada → hero tetap + 4 kartu skeleton', async () => {
        const wrapper = mountIndex(undefined);
        try {
            await nextTick();

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);

            expect(wrapper.findAll('.queue-index-skeleton')).toHaveLength(4);
            expect(wrapper.text()).toContain('Antrean interview');
            expect(wrapper.text()).not.toContain('Sesi Pagi');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Attendance skeleton (M2 Task 12)', () => {
    function mountAttendance(
        url: TAttendanceProps['trackingLoginUrl']
    ): VueWrapper<InstanceType<typeof AttendancePage>> {
        return mount(AttendancePage, {
            props: { trackingLoginUrl: url },
            global: {
                stubs: {
                    Button: true,
                    Card: true,
                    CardContent: true,
                    CardHeader: true,
                    CardTitle: true,
                },
            },
        });
    }

    it('props lengkap → konten, tanpa skeleton', async () => {
        const wrapper = mountAttendance('/track/login');
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Cara absensi');
        } finally {
            wrapper.unmount();
        }
    });

    it('prop belum ada → skeleton header + 3 langkah + tautan', async () => {
        const wrapper = mountAttendance(undefined);
        try {
            await nextTick();

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);

            expect(wrapper.findAll('.attendance-step-skeleton')).toHaveLength(3);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Track/Edit skeleton (M2 Task 12)', () => {
    type TApplicationFormData = NonNullable<TTrackEditProps['application']>;

    function demoApplication(): TApplicationFormData {
        return {
            full_name: 'Ayu Lestari',
            nim: 'A11.2023.12345',
            semester: 3,
            phone: '081234567890',
            personal_email: 'ayu@example.com',
            student_email: 'ayu@students.unimus.ac.id',
            instagram_username: 'ayu.lestari',
            primary_division_id: 'div-1',
            secondary_division_id: null,
            portfolio_type: 'none',
            portfolio_url: null,
            cv_original_name: null,
            portfolio_original_name: null,
            instagram_follow_original_name: null,
            twibbon_url: null,
        };
    }

    function mountEdit(application: TTrackEditProps['application']): VueWrapper<InstanceType<typeof TrackEdit>> {
        return mount(TrackEdit, {
            props: {
                application,
                divisions: [{ id: 'div-1', name: 'Divisi A' }],
                updateUrl: '/recruitment/track',
                dashboardUrl: '/recruitment/track/dashboard',
            },
            global: {
                stubs: {
                    Button: true,
                    CometSpinner: true,
                    Input: true,
                    Label: true,
                    Card: true,
                    CardContent: true,
                    CardHeader: true,
                    CardTitle: true,
                    SearchableSelect: true,
                    Separator: true,
                },
            },
        });
    }

    it('props lengkap → form + tombol M1 utuh, tanpa skeleton', async () => {
        const wrapper = mountEdit(demoApplication());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Data diri');
            expect(wrapper.text()).toContain('Simpan perubahan');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('application belum ada → skeleton semua zona, tanpa crash', async () => {
        const wrapper = mountEdit(undefined);
        try {
            await nextTick();

            const regions = wrapper.findAll('[aria-busy="true"]');
            expect(regions.length).toBeGreaterThan(0);
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);
            }

            expect(wrapper.findAll('.track-edit-field-skeleton').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Data diri');
        } finally {
            wrapper.unmount();
        }
    });
});
