import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import TrackShow from '../Show.vue';
import TrackFeedback from '../Feedback.vue';

/** Tipe payload tracking diturunkan dari props komponen agar fixture tak menduplikasi bentuk. */
type TTrackingPayload = NonNullable<InstanceType<typeof TrackShow>['$props']['tracking']>;

/** Tipe aplikasi ringkas Feedback diturunkan dari props komponen. */
type TFeedbackApplication = NonNullable<InstanceType<typeof TrackFeedback>['$props']['application']>;

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5/§4.2, M2 Task 8 Part A (pola Task 1): skeleton missing-props —
 * - Track/Show: `tracking` belum ada → skeleton status + hero + interview +
 *   timeline 4 node + data + final + feedback; Dialog koreksi M1 tak disentuh.
 * - Track/Feedback: hanya chrome yang bergantung props (`application`) yang
 *   skeleton; OpRecFeedbackForm internals tak disentuh.
 */

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        Head: { template: '<div style="display:none"></div>' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        router: { post: vi.fn(), get: vi.fn(), visit: vi.fn(), reload: vi.fn() },
        useForm: <T extends object>(initial: T) => {
            const errors = reactive<Record<string, string>>({});
            return reactive({
                ...initial,
                errors,
                processing: false,
                post: vi.fn(),
                reset: vi.fn(),
                clearErrors: vi.fn(),
            });
        },
    };
});

vi.mock('@/layouts/FormFillLayout.vue', () => ({ default: { template: '<slot />' } }));

function demoTracking(): TTrackingPayload {
    return {
        application: {
            registration_number: 'OPREC-2026-00001',
            full_name: 'Ayu Lestari',
            nim: 'A11.2023.12345',
            semester: 3,
            stage: 'screening',
            stage_label: 'Screening',
            result: 'pending',
            result_label: 'Menunggu',
            revision_required: false,
            primary_division: 'Divisi A',
            secondary_division: null,
            submitted_at: null,
        },
        period: { name: 'Gelombang 1' },
        next_action: {
            tone: 'info',
            title: 'Lengkapi data',
            description: 'Perbaiki data sesuai instruksi tim.',
            action: null,
        },
        timeline: [
            { key: 'daftar', label: 'Pendaftaran', status: 'completed' },
            { key: 'screening', label: 'Screening', status: 'current' },
            { key: 'interview', label: 'Interview', status: 'upcoming' },
            { key: 'final', label: 'Final', status: 'upcoming' },
        ],
        interview: null,
        queue: null,
        attendance: null,
        attendance_qr_base64: null,
        final: null,
        edit: { can_edit: false, can_request_correction: true, latest_correction: null },
        feedback: { can_submit: false, submitted: false, submitted_at: null },
    };
}

function mountTrackShow(tracking: TTrackingPayload | undefined): VueWrapper<InstanceType<typeof TrackShow>> {
    const props: InstanceType<typeof TrackShow>['$props'] = {
        tracking,
        logoutUrl: '/recruitment/track/logout',
        editUrl: '/recruitment/track/edit',
        correctionUrl: '/recruitment/track/correction',
        feedbackStoreUrl: '/recruitment/track/feedback',
    };
    return mount(TrackShow, {
        props,
        global: {
            stubs: {
                OpRecFeedbackForm: true,
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                Badge: true,
                Separator: true,
                Textarea: true,
                Label: true,
                Dialog: true,
                DialogContent: true,
                DialogDescription: true,
                DialogFooter: true,
                DialogHeader: true,
                DialogTitle: true,
            },
        },
    });
}

function mountFeedback(application: TFeedbackApplication | undefined): VueWrapper<InstanceType<typeof TrackFeedback>> {
    const props: InstanceType<typeof TrackFeedback>['$props'] = {
        application,
        storeUrl: '/recruitment/track/feedback',
        dashboardUrl: '/recruitment/track/dashboard',
    };
    return mount(TrackFeedback, {
        props,
        global: {
            stubs: {
                OpRecFeedbackForm: true,
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                Button: true,
            },
        },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Track/Show skeleton (M2 Task 8)', () => {
    it('props lengkap → konten fade-up, tanpa skeleton', async () => {
        const wrapper = mountTrackShow(demoTracking());
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Ayu Lestari');
            expect(wrapper.text()).toContain('Alur proses');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('tracking belum ada → skeleton semua zona + Dialog M1 utuh', async () => {
        const wrapper = mountTrackShow(undefined);
        try {
            await nextTick();

            const regions = wrapper.findAll('[aria-busy="true"]');
            expect(regions.length).toBeGreaterThan(0);
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);
            }

            // Timeline: 4 node (dot + 2 baris) sesuai cuplikan brief.
            expect(wrapper.findAll('.track-timeline-node')).toHaveLength(4);
            expect(wrapper.find('.track-hero-skeleton').exists()).toBe(true);
            expect(wrapper.find('.track-interview-skeleton').exists()).toBe(true);
            expect(wrapper.find('.track-final-skeleton').exists()).toBe(true);
            expect(wrapper.find('.track-feedback-skeleton').exists()).toBe(true);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

            expect(wrapper.text()).not.toContain('Ayu Lestari');
            // Footer statis tetap.
            expect(wrapper.text()).toContain('Info OpenRecruitment');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Track/Feedback skeleton (M2 Task 8)', () => {
    it('props lengkap → header + form + back link, tanpa skeleton', async () => {
        const wrapper = mountFeedback({
            full_name: 'Ayu Lestari',
            registration_number: 'OPREC-2026-00001',
        });
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Ayu Lestari');
            expect(wrapper.text()).toContain('Kembali ke portal');
        } finally {
            wrapper.unmount();
        }
    });

    it('application belum ada → skeleton header saja; form + back link tetap', async () => {
        const wrapper = mountFeedback(undefined);
        try {
            await nextTick();

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);

            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).toContain('Kembali ke portal');
        } finally {
            wrapper.unmount();
        }
    });
});
