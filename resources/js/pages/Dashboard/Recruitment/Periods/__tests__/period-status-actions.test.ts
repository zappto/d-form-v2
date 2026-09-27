import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import PeriodsShow from '../Show.vue';
import { showErrorToast, showFlashToast } from '@/lib/error-message';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 4: tombol Buka/Tutup pendaftaran periode —
 * saat sibuk: CometSpinner 16px inline + teks 'Menyimpan...' + disabled + aria-busy="true";
 * sukses → showFlashToast; gagal → showErrorToast + tombol pulih.
 */

const { routerPostMock } = vi.hoisted(() => ({ routerPostMock: vi.fn() }));

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: { post: routerPostMock, get: vi.fn(), delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
    usePage: () => ({
        props: {
            auth: {
                user: {
                    can_manage_recruitment_periods: true,
                    can_list_recruitment_applications: false,
                    can_schedule_recruitment_interviews: false,
                    can_screen_recruitment_applications: false,
                    can_view_recruitment_reports: false,
                },
            },
        },
    }),
    useForm: () => ({
        user_id: '',
        recruitment_division_id: '',
        errors: {},
        processing: false,
        post: vi.fn(),
        reset: vi.fn(),
    }),
}));

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/lib/error-message', () => ({
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

interface IRouterMutationOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

function lastPostOptions(): IRouterMutationOptions {
    const calls = routerPostMock.mock.calls as unknown[][];
    expect(routerPostMock).toHaveBeenCalled();
    const options = calls[calls.length - 1]?.[2] as IRouterMutationOptions | undefined;
    expect(options).toBeDefined();
    return options as IRouterMutationOptions;
}

function basePeriod(status: 'draft' | 'open') {
    return {
        id: 'per-1',
        name: 'Gelombang 1',
        slug: 'gelombang-1',
        status,
        status_label: status === 'draft' ? 'Draf' : 'Dibuka',
        description: null,
        registration_opens_at: null,
        registration_closes_at: null,
        interview_starts_at: null,
        interview_ends_at: null,
        finalization_deadline_at: null,
        applications_count: 0,
    };
}

const CHILD_STUBS = {
    PeriodApplicantSection: true,
    PeriodInterviewSection: true,
    PeriodReportSection: true,
    ApplicantDetailPanel: true,
    ConfirmationModal: true,
    InterviewerCreateSheet: true,
    Avatar: true,
    AvatarFallback: true,
    Badge: true,
    Card: true,
    CardContent: true,
    CardHeader: true,
    CardTitle: true,
    Label: true,
    SearchableSelect: true,
    Tabs: true,
    TabsContent: true,
    TabsList: true,
    TabsTrigger: true,
    Tooltip: true,
    TooltipContent: true,
    TooltipProvider: true,
} as const;

function mountShow(status: 'draft' | 'open'): VueWrapper {
    return mount(PeriodsShow, {
        props: {
            period: basePeriod(status),
            queue_counts: {},
            divisionOptions: [],
            stageOptions: [],
            query: {},
            tab: 'peserta',
        },
        global: { stubs: CHILD_STUBS },
    }) as unknown as VueWrapper;
}

function statusButton(wrapper: VueWrapper, action: 'Buka' | 'Tutup'): ReturnType<VueWrapper['find']> {
    const label = action === 'Buka' ? 'Buka pendaftaran Gelombang 1' : 'Tutup pendaftaran Gelombang 1';
    return wrapper.find(`button[aria-label="${label}"]`);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Periods/Show open/close (Task 4)', () => {
    it('klik Buka → sibuk (spinner + Menyimpan... + disabled + aria-busy) + POST ke URL open', async () => {
        const wrapper = mountShow('draft');
        try {
            const btn = statusButton(wrapper, 'Buka');
            expect(btn.exists()).toBe(true);
            await btn.trigger('click');
            await nextTick();

            expect(routerPostMock).toHaveBeenCalledTimes(1);
            expect(routerPostMock.mock.calls[0]?.[0]).toBe('/admin/recruitment/periods/per-1/open');

            const busy = statusButton(wrapper, 'Buka');
            expect(busy.attributes('disabled')).not.toBeUndefined();
            expect(busy.attributes('aria-busy')).toBe('true');
            expect(busy.find('[role="status"]').exists()).toBe(true);
            expect(busy.text()).toContain('Menyimpan...');
        } finally {
            wrapper.unmount();
        }
    });

    it('open sukses → toast sukses + tombol pulih', async () => {
        const wrapper = mountShow('draft');
        try {
            await statusButton(wrapper, 'Buka').trigger('click');
            await nextTick();
            const options = lastPostOptions();
            options.onSuccess?.();
            options.onFinish?.();
            await nextTick();

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Periode recruitment dibuka untuk pendaftaran.',
            });
            const btn = statusButton(wrapper, 'Buka');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('false');
            expect(btn.find('[role="status"]').exists()).toBe(false);
            expect(btn.text()).toContain('Buka pendaftaran');
        } finally {
            wrapper.unmount();
        }
    });

    it('open gagal → toast error + tombol pulih', async () => {
        const wrapper = mountShow('draft');
        try {
            await statusButton(wrapper, 'Buka').trigger('click');
            await nextTick();
            const options = lastPostOptions();
            options.onError?.({});
            options.onFinish?.();
            await nextTick();

            expect(showErrorToast).toHaveBeenCalledWith('Gagal membuka periode recruitment. Coba lagi.');
            const btn = statusButton(wrapper, 'Buka');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.find('[role="status"]').exists()).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });

    it('klik ganda Buka → hanya satu request', async () => {
        const wrapper = mountShow('draft');
        try {
            const btn = statusButton(wrapper, 'Buka');
            await btn.trigger('click');
            await nextTick();
            await statusButton(wrapper, 'Buka').trigger('click');
            await nextTick();
            expect(routerPostMock).toHaveBeenCalledTimes(1);
        } finally {
            wrapper.unmount();
        }
    });

    it('klik Tutup → sibuk + POST ke URL close', async () => {
        const wrapper = mountShow('open');
        try {
            const btn = statusButton(wrapper, 'Tutup');
            expect(btn.exists()).toBe(true);
            await btn.trigger('click');
            await nextTick();

            expect(routerPostMock).toHaveBeenCalledTimes(1);
            expect(routerPostMock.mock.calls[0]?.[0]).toBe('/admin/recruitment/periods/per-1/close');

            const busy = statusButton(wrapper, 'Tutup');
            expect(busy.attributes('disabled')).not.toBeUndefined();
            expect(busy.attributes('aria-busy')).toBe('true');
            expect(busy.find('[role="status"]').exists()).toBe(true);
            expect(busy.text()).toContain('Menyimpan...');
        } finally {
            wrapper.unmount();
        }
    });

    it('close sukses → toast sukses + tombol pulih', async () => {
        const wrapper = mountShow('open');
        try {
            await statusButton(wrapper, 'Tutup').trigger('click');
            await nextTick();
            const options = lastPostOptions();
            options.onSuccess?.();
            options.onFinish?.();
            await nextTick();

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Periode recruitment ditutup.',
            });
            const btn = statusButton(wrapper, 'Tutup');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('false');
            expect(btn.text()).toContain('Tutup pendaftaran');
        } finally {
            wrapper.unmount();
        }
    });

    it('close gagal → toast error + tombol pulih', async () => {
        const wrapper = mountShow('open');
        try {
            await statusButton(wrapper, 'Tutup').trigger('click');
            await nextTick();
            const options = lastPostOptions();
            options.onError?.({});
            options.onFinish?.();
            await nextTick();

            expect(showErrorToast).toHaveBeenCalledWith('Gagal menutup periode recruitment. Coba lagi.');
            const btn = statusButton(wrapper, 'Tutup');
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.find('[role="status"]').exists()).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });
});
