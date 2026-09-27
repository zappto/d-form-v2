import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import MyInterviewsShow from '../MyInterviews/Show.vue';
import InterviewSessionsShow from '../InterviewSessions/Show.vue';

/** Tipe detail diturunkan dari props komponen agar fixture tak menduplikasi bentuk. */
type DetailPayload = NonNullable<InstanceType<typeof MyInterviewsShow>['$props']['detail']>;

/** Tipe sesi interview diturunkan dari props komponen. */
type SessionDetail = NonNullable<InstanceType<typeof InterviewSessionsShow>['$props']['session']>;

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5/§7.2, M2 Task 9 (pola Task 1): skeleton missing-props detail —
 * - MyInterviews/Show: `detail` belum ada → skeleton header + dokumen +
 *   penilaian; tombol submit penilaian M1 tak disentuh (assert hadir).
 * - InterviewSessions/Show: `session` belum ada → skeleton header + eligible +
 *   interviews; tombol Pindah M1 tak disentuh (assert hadir).
 * Props terisi → skeleton hilang + fade-up konten.
 */

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        Head: { template: '<div style="display:none"></div>' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        router: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
        usePage: () => ({
            props: {
                auth: {
                    user: {
                        can_view_recruitment_queue: false,
                        can_screen_recruitment_applications: false,
                        can_review_recruitment_corrections: false,
                        can_decide_recruitment_final: false,
                    },
                },
            },
            url: '/dashboard/recruitment',
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

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function demoDetail(): DetailPayload {
    return {
        application: {
            id: 'ap-1',
            registration_number: 'OPREC-2026-00001',
            full_name: 'Budi Santoso',
            nim: 'A11.2023.12345',
            semester: 3,
            primary_division: 'Divisi A',
            secondary_division: null,
        },
        documents: {
            has_cv: false,
            has_portfolio: false,
            portfolio_is_url: false,
            has_instagram_follow: false,
            cv_download_url: null,
            portfolio_download_url: null,
            portfolio_url: null,
            twibbon_url: null,
            cv_original_name: null,
            cv_size_bytes: null,
            cv_preview_url: null,
            portfolio_original_name: null,
            portfolio_size_bytes: null,
            portfolio_preview_url: null,
            instagram_follow_download_url: null,
            instagram_follow_preview_url: null,
            instagram_follow_original_name: null,
            instagram_follow_size_bytes: null,
        },
        interview: {
            scheduled_at: '2026-01-01T09:00:00+07:00',
            location: 'Gedung A',
            room: 'Ruang 1',
            status_label: 'Terjadwal',
            session: null,
        },
        queue: null,
        evaluation: {
            speaking_score: 7,
            technical_score: 6,
            attitude_score: 8,
            recommendation: 'recommended',
            recommendation_label: 'Direkomendasikan',
            notes: null,
            is_locked: false,
            can_edit: true,
        },
    };
}

function mountMyInterviews(detail: DetailPayload | undefined): VueWrapper<InstanceType<typeof MyInterviewsShow>> {
    const props: InstanceType<typeof MyInterviewsShow>['$props'] = {
        detail,
        evaluateUrl: '/dashboard/recruitment/my-interviews/ap-1/evaluate',
        recommendationOptions: [
            { value: 'recommended', label: 'Direkomendasikan' },
            { value: 'not_recommended', label: 'Tidak direkomendasikan' },
        ],
        flashMessage: null,
    };
    return mount(MyInterviewsShow, {
        props,
        global: {
            stubs: {
                Badge: true,
                Card: true,
                CardContent: true,
                Label: true,
                Separator: true,
                Sheet: true,
                SheetContent: true,
                SessionQueueDrawer: true,
            },
        },
    });
}

function demoSession(): SessionDetail {
    return {
        id: 'ses-1',
        session_date: '2026-10-01',
        starts_at: '09:00',
        ends_at: '12:00',
        location: 'Gedung A',
        room: 'Ruang 1',
        notes: null,
        is_active: true,
        interviews_count: 1,
        period: null,
        division: null,
        interviews: [
            {
                id: 'iv-1',
                scheduled_at: null,
                location: 'Gedung A',
                room: 'Ruang 1',
                status: 'scheduled',
                status_label: 'Terjadwal',
                application: {
                    id: 'ap-1',
                    full_name: 'Budi Santoso',
                    registration_number: 'OPREC-2026-00001',
                },
                interviewer: null,
            },
        ],
    };
}

function mountInterviewSessions(
    session: SessionDetail | undefined
): VueWrapper<InstanceType<typeof InterviewSessionsShow>> {
    const props: InstanceType<typeof InterviewSessionsShow>['$props'] = {
        session,
        eligibleApplicants: [],
        interviewerOptions: [],
        otherSessions: [{ id: 'ses-2', session_date: '2026-10-02', starts_at: '13:00', division: null }],
    };
    return mount(InterviewSessionsShow, {
        props,
        global: {
            stubs: {
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                Label: true,
                SearchableSelect: true,
                InterviewerCreateSheet: true,
                Tooltip: true,
                TooltipContent: true,
                TooltipProvider: true,
                TooltipTrigger: true,
            },
        },
    });
}

function actionButton(wrapper: VueWrapper, label: string): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.text().includes(label));
    if (!found) throw new Error(`tombol "${label}" tidak ditemukan`);
    return found as DOMWrapper<HTMLButtonElement>;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('MyInterviews/Show detail skeleton (M2 Task 9)', () => {
    it('props lengkap → konten fade-up + tombol M1 utuh, tanpa skeleton', async () => {
        const wrapper = mountMyInterviews(demoDetail());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.find('.fade-up').exists()).toBe(true);

            // M1 Task 8: tombol submit penilaian tak disentuh dan tetap hadir.
            const submit = actionButton(wrapper, 'Simpan penilaian');
            expect(submit.attributes('aria-busy')).toBe('false');
        } finally {
            wrapper.unmount();
        }
    });

    it('detail belum ada → skeleton semua zona, tanpa crash', async () => {
        const wrapper = mountMyInterviews(undefined);
        try {
            await nextTick();

            const regions = wrapper.findAll('[aria-busy="true"]');
            expect(regions.length).toBeGreaterThan(0);
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);
            }

            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Budi Santoso');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('InterviewSessions/Show detail skeleton (M2 Task 9)', () => {
    it('props lengkap → konten fade-up + tombol Pindah M1 utuh, tanpa skeleton', async () => {
        const wrapper = mountInterviewSessions(demoSession());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Informasi sesi');
            expect(wrapper.find('.fade-up').exists()).toBe(true);

            // M1 Task 4: tombol reschedule tak disentuh dan tetap hadir.
            const reschedule = actionButton(wrapper, 'Pindah');
            expect(reschedule.attributes('aria-busy')).toBe('false');
        } finally {
            wrapper.unmount();
        }
    });

    it('session belum ada → skeleton semua zona, tanpa crash', async () => {
        const wrapper = mountInterviewSessions(undefined);
        try {
            await nextTick();

            const regions = wrapper.findAll('[aria-busy="true"]');
            expect(regions.length).toBeGreaterThan(0);
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);
            }

            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Informasi sesi');
        } finally {
            wrapper.unmount();
        }
    });
});
