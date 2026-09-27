import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import PeriodsShow from '../Periods/Show.vue';
import { Tabs } from '@/components/ui/tabs';
import ApplicantDetailPanel from '@/components/modules/dashboard/recruitment/ApplicantDetailPanel.vue';
import type { IApplicationDetail } from '@/components/modules/dashboard/recruitment/ApplicantDetailContent.vue';

/** Tipe baris aplikan diturunkan dari props komponen agar fixture tak menduplikasi bentuk. */
type ApplicationRow = NonNullable<InstanceType<typeof PeriodsShow>['$props']['applications']>[number];

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5, M2 Task 4 (pola Task 1; ruling scope: Forms/Show SUDAH di Task 3):
 * - Tabel aplikan: flag `isLoadingApplicants` (onStart/onFinish tab visit);
 *   thead 7 kolom tetap + 10 `.applicant-row-skeleton`; tabs/filter visible.
 * - Panel detail: `detailLoading` → cabang skeleton (avatar + nama + meta +
 *   baris teks + 2 tombol), BUKAN konten; `opacity-60` dihapus (aria-busy kept).
 * - Forms/Show jawaban: terverifikasi via suite Task 3 (tidak disentuh).
 */

const { routerGetMock } = vi.hoisted(() => ({ routerGetMock: vi.fn() }));

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
        useForm: (initial: Record<string, unknown>) => {
            const errors = reactive<Record<string, string>>({});
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: vi.fn(),
                reset: vi.fn(),
                clearErrors: vi.fn(),
            });
            return state;
        },
    };
});

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

interface RouterGetOptions {
    preserveState?: boolean;
    preserveScroll?: boolean;
    onStart?: () => void;
    onFinish?: () => void;
}

function lastGetOptions(): RouterGetOptions {
    expect(routerGetMock).toHaveBeenCalled();
    const options = routerGetMock.mock.calls[0]?.[2] as RouterGetOptions | undefined;
    expect(options).toBeDefined();
    return options as RouterGetOptions;
}

function demoRow(): ApplicationRow {
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

function mountShow(): VueWrapper<InstanceType<typeof PeriodsShow>> {
    return mount(PeriodsShow, {
        props: {
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
            applications: [demoRow()],
            queue_counts: {},
            divisionOptions: [{ id: 'div-1', name: 'Divisi A', code: 'A' }],
            stageOptions: [{ value: 'submitted', label: 'Submitted' }],
            semesterOptions: [],
            query: {},
            tab: 'peserta',
        },
        global: {
            stubs: {
                ApplicantDetailPanel: true,
                PeriodInterviewSection: true,
                PeriodReportSection: true,
                ConfirmationModal: true,
                InterviewerCreateSheet: true,
                SearchableSelect: true,
                Avatar: true,
                AvatarFallback: true,
                Tooltip: true,
                TooltipContent: true,
                TooltipProvider: true,
                TooltipTrigger: true,
            },
        },
    });
}

function switchTab(wrapper: VueWrapper, value: string): Promise<void> {
    // Klik sintetik pada TabsTrigger reka-ui tidak memicu update:model-value di
    // jsdom — emit langsung ke Tabs real (pola $emit ConfirmationModal Task 7):
    // yang diuji adalah wiring onTabChange → flag → skeleton, bukan reka-ui.
    const tabs = wrapper.findComponent(Tabs);
    if (!tabs.exists()) throw new Error('komponen Tabs tidak ditemukan');
    tabs.vm.$emit('update:modelValue', value);
    return nextTick();
}

async function gotoInterview(wrapper: VueWrapper): Promise<void> {
    await switchTab(wrapper, 'interview');
    await nextTick();
}

function demoApplication(): IApplicationDetail {
    return {
        id: 'ap-1',
        registration_number: 'OPREC-2026-00001',
        full_name: 'Budi Santoso',
        nim: 'A11.2023.12345',
        semester: 3,
        phone: '081234567890',
        personal_email: 'budi@example.com',
        student_email: 'budi@students.unimus.ac.id',
        instagram_username: 'budi.santoso',
        stage: 'screening',
        stage_label: 'Screening',
        result: 'pending',
        result_label: 'Menunggu',
        is_verified: false,
        revision_required: false,
        submitted_at: null,
        period: { id: 'per-1', name: 'Gelombang 1' },
        primary_division: { id: 'div-1', name: 'Divisi A', code: 'A' },
        secondary_division: null,
        document: null,
        screenings: [],
        activity_logs: [],
        correction_requests: [],
        evaluation: null,
        final_decision: null,
        can_screen: false,
        can_verify: false,
        can_decide_final: false,
        can_resend_tracking: false,
    };
}

function mountPanel(
    application: IApplicationDetail | null,
    loading: boolean
): VueWrapper<InstanceType<typeof ApplicantDetailPanel>> {
    return mount(ApplicantDetailPanel, {
        props: { application, loading, editable: false },
        global: {
            stubs: {
                Sheet: true,
                SheetContent: true,
                SheetDescription: true,
                SheetHeader: true,
                SheetTitle: true,
                Badge: true,
                Button: true,
                ApplicantDetailContent: true,
            },
        },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    routerGetMock.mockReset();
    // Cerminkan Inertia: onStart jalan saat visit berangkat; onFinish hanya
    // bila test memicunya eksplisit (navigasi "menggantung").
    routerGetMock.mockImplementation((...args: unknown[]) => {
        const options = args[2] as RouterGetOptions | undefined;
        options?.onStart?.();
        return undefined;
    });
});

describe('Periods/Show tabel aplikan skeleton (M2 Task 4)', () => {
    it('ada data + idle → baris asli + thead 7 kolom, tanpa skeleton', async () => {
        const wrapper = mountShow();
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.findAll('thead th')).toHaveLength(7);
        } finally {
            wrapper.unmount();
        }
    });

    it('pindah tab → thead tetap + 10 skeleton baris + konten hidden + tabs/filter visible', async () => {
        const wrapper = mountShow();
        try {
            await gotoInterview(wrapper);
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            // thead asli (7 kolom) tetap.
            expect(wrapper.findAll('thead th')).toHaveLength(7);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            const rows = wrapper.findAll('.applicant-row-skeleton');
            expect(rows).toHaveLength(10);
            for (const row of rows) {
                expect(row.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            }

            expect(wrapper.text()).not.toContain('Budi Santoso');

            // Tabs + filter bar tidak ikut hilang.
            expect(wrapper.text()).toContain('Peserta');
            expect(wrapper.find('input').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi selesai → skeleton hilang + baris asli kembali', async () => {
        const wrapper = mountShow();
        try {
            await gotoInterview(wrapper);
            await nextTick();
            expect(wrapper.findAll('.applicant-row-skeleton')).toHaveLength(10);

            lastGetOptions().onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('ApplicantDetailPanel skeleton (M2 Task 4)', () => {
    it('siap → konten + tanpa skeleton/opacity-60', async () => {
        const wrapper = mountPanel(demoApplication(), false);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.html()).not.toContain('opacity-60');
            expect(wrapper.find('[aria-busy="false"]').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('loading → skeleton panel (avatar/nama/meta/teks/2 tombol) + tanpa opacity-60/konten', async () => {
        const wrapper = mountPanel(demoApplication(), true);
        try {
            await nextTick();

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.html()).not.toContain('opacity-60');
            // Stale content diganti skeleton, bukan ditimpa redup.
            expect(wrapper.text()).not.toContain('Budi Santoso');
        } finally {
            wrapper.unmount();
        }
    });
});
