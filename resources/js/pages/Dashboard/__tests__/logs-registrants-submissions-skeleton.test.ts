import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import ActivityLogsIndex from '../Recruitment/ActivityLogs/Index.vue';
import RegistrantsPage from '../Events/Registrants.vue';
import FormsShow from '../Events/Forms/Show.vue';
import FormAnswerDetailSheet from '@/components/modules/dashboard/FormAnswerDetailSheet.vue';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5, M2 Task 3 (pola Task 1): skeleton GET memakai `Skeleton.vue`
 * (`data-slot="skeleton"`) + region `aria-busy`/`aria-label` Indonesia;
 * header/filter/toolbar/tabs tetap terlihat; konten hidden saat sibuk dan
 * muncul dengan `.fade-up` setelah selesai.
 * - ActivityLogs: flag `isLoadingLogs` (onStart/onFinish); 8 `.log-row-skeleton`.
 * - Registrants: filter LOKAL (tanpa GET) → skeleton HANYA saat `registrants`
 *   undefined awal; tabel 5 kolom × 10 `.reg-row-skeleton` + pager skeleton.
 * - Forms/Show jawaban: flag `isLoadingSubmissions` (tab visit + reload only
 *   submissions); 10 `.jawaban-row-skeleton` + pager; sheet dapat cabang skeleton.
 */

const { routerGetMock, routerReloadMock, routerVisitMock, putMock } = vi.hoisted(() => ({
    routerGetMock: vi.fn<(url: string, data: TRouterGetData, options?: IAsyncOptions) => void>(),
    routerReloadMock: vi.fn<(options?: IAsyncOptions) => void>(),
    routerVisitMock: vi.fn<(url: string, options?: IAsyncOptions) => void>(),
    putMock: vi.fn(),
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
            reload: routerReloadMock,
            visit: routerVisitMock,
        },
        usePage: () => ({
            props: { auth: { user: {} } },
            url: 'http://localhost/dashboard/events/ev-1/forms/fo-1?tab=jawaban',
        }),
        useForm: <T extends object>(initial: T) => {
            const errors = reactive<Record<string, string>>({});
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: vi.fn(),
                put: putMock,
                transform: () => ({ put: putMock }),
                reset: vi.fn(),
                clearErrors: vi.fn(),
            });
            return state;
        },
    };
});

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));
vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: {
        props: ['title', 'description'],
        template:
            '<div data-testid="empty-state"><p>{{ title }}</p><p v-if="description">{{ description }}</p><slot /></div>',
    },
}));

vi.mock('@/lib/errorMessage', () => ({
    getFieldError: () => undefined,
    humanizeErrorMessage: (message: string): string => message,
    parseApiErrorMessage: (message: string): string => message,
}));

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({
        handleInertiaFormErrors: vi.fn(),
        showErrorToast: vi.fn(),
        showHttpErrorToast: vi.fn(),
    }),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('axios', () => ({
    default: { post: vi.fn(), patch: vi.fn(), isAxiosError: () => false },
}));

interface IAsyncOptions {
    preserveState?: boolean;
    preserveScroll?: boolean;
    replace?: boolean;
    only?: string[];
    onStart?: () => void;
    onSuccess?: () => void;
    onFinish?: () => void;
}

/** Bentuk data query yang dikirim `router.get` pada halaman yang diuji. */
type TRouterGetData = Record<string, string | number | undefined>;

/** Opsi call GET terakhir; mock `get(url, data, options)` → indeks 2. */
function lastGetOptions(): IAsyncOptions {
    expect(routerGetMock).toHaveBeenCalled();
    const options = routerGetMock.mock.calls[0]?.[2];
    expect(options).toBeDefined();
    if (!options) throw new Error('opsi GET tidak ditemukan');
    return options;
}

/** Opsi call reload terakhir; mock `reload(options)` → indeks 0. */
function lastReloadOptions(): IAsyncOptions {
    expect(routerReloadMock).toHaveBeenCalled();
    const options = routerReloadMock.mock.calls[0]?.[0];
    expect(options).toBeDefined();
    if (!options) throw new Error('opsi reload tidak ditemukan');
    return options;
}

function demoLog(id: string, action: string): ILogRowFixture {
    return {
        id,
        action,
        actor_type: 'staff',
        actor: { id: 'u-1', name: 'Andi' },
        application: {
            id: 'ap-1',
            recruitment_period_id: null,
            registration_number: 'REG-001',
            full_name: 'Budi Santoso',
        },
        created_at: '2026-01-01T10:00:00+07:00',
    };
}

interface ILogRowFixture {
    id: string;
    action: string;
    actor_type: string;
    actor: { id: string; name: string } | null;
    application: {
        id: string;
        recruitment_period_id: string | null;
        registration_number: string;
        full_name: string;
    } | null;
    created_at: string | null;
}

function mountLogs(data: ILogRowFixture[]): VueWrapper<InstanceType<typeof ActivityLogsIndex>> {
    return mount(ActivityLogsIndex, {
        props: {
            logs: { data, links: [] },
            periodOptions: [{ id: 'per-1', name: 'Gelombang 1' }],
            query: { period_id: null, action: null },
        },
    });
}

function demoEvent(): IEvent {
    return {
        id: 'ev-1',
        slug: 'acara',
        title: 'Acara',
        description: 'Deskripsi',
        start_date: '2026-10-01',
        end_date: '2026-10-02',
        registration_start: '2026-09-01',
        registration_end: '2026-09-30',
        location: 'Kampus',
        quota: 100,
        registered_count: 2,
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

function demoRegistrant(id: string, name: string): IRegistrant {
    return {
        id,
        form_id: 'fo-1',
        form: { id: 'fo-1', title: 'Formulir A' },
        user: { id: `u-${id}`, name, email: `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`, avatar: null },
        event_id: 'ev-1',
        status: 'pending',
        submitted_at: '2026-01-01T10:00:00+07:00',
        answers: {},
        registration_code: `REG-${id}`,
        reviewed_at: null,
    };
}

function mountRegistrants(registrants: IRegistrant[] | undefined): VueWrapper<InstanceType<typeof RegistrantsPage>> {
    return mount(RegistrantsPage, {
        props: {
            event: demoEvent(),
            forms: [{ id: 'fo-1', title: 'Formulir A' }],
            registrants,
        },
        global: {
            stubs: {
                RegistrantsStatCards: true,
                RegistrantsPendingBanner: true,
                UserAvatarFallback: true,
                Badge: true,
                Button: true,
                Card: true,
                CardContent: true,
                CardDescription: true,
                CardHeader: true,
                CardTitle: true,
                Label: true,
                Tabs: true,
                TabsList: true,
                TabsTrigger: true,
                SearchableSelect: true,
            },
        },
    });
}

function demoForm(): IForm {
    return {
        id: 'fo-1',
        title: 'Formulir A',
        description: '',
        visible_for: [],
        closed_at: '',
        event_id: 'ev-1',
        banner_url: null,
        banner_caption: null,
    };
}

function demoSubmission(id: string, name: string): IFormSubmission {
    return {
        id,
        user: { id: `u-${id}`, name, email: `${id}@example.com`, avatar: null },
        answers: { nama: name, email: `${id}@example.com` },
        submitted_at: '2026-01-01T10:00:00+07:00',
        review_status: 'pending',
        reviewed_at: null,
    };
}

function mountFormsShow(submissions: IFormSubmission[]): VueWrapper<InstanceType<typeof FormsShow>> {
    return mount(FormsShow, {
        props: {
            event: { id: 'ev-1', title: 'Acara' },
            form: demoForm(),
            fields: [],
            saveFieldsUrl: '/save-fields',
            updateFormUrl: '/update-form',
            autosaveFormUrl: '/autosave',
            submissions,
            submissionsCount: submissions.length,
        },
        global: {
            stubs: {
                FormBuilderWorkspace: true,
                AutosaveStatus: true,
                FormAnswerDetailSheet: true,
                UserAvatarFallback: true,
                Badge: true,
                Table: true,
                TableBody: true,
                TableCell: true,
                TableHead: true,
                TableHeader: true,
                TableRow: true,
                Tooltip: true,
                TooltipContent: true,
                TooltipProvider: true,
                TooltipTrigger: true,
                Tabs: true,
                TabsContent: true,
                TabsList: true,
                TabsTrigger: true,
            },
        },
    });
}

function reviewButton(wrapper: VueWrapper, label: string): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.attributes('aria-label') === label);
    if (!found) throw new Error(`tombol "${label}" tidak ditemukan`);
    return found as DOMWrapper<HTMLButtonElement>;
}

/** Tipe props diturunkan dari komponen agar fixture tak menduplikasi bentuk. */
type TFormAnswerDetailSheetProps = InstanceType<typeof FormAnswerDetailSheet>['$props'];

function mountSheet(
    submission: IFormSubmission | null,
    loading?: boolean
): VueWrapper<InstanceType<typeof FormAnswerDetailSheet>> {
    const props: TFormAnswerDetailSheetProps = {
        open: true,
        submission,
        answerKeys: ['nama'],
        fields: [],
        formatDate: (value: string): string => value,
        humanizeKey: (key: string): string => key,
        isSubmissionReviewing: (): boolean => false,
        loading,
    };
    return mount(FormAnswerDetailSheet, {
        props,
        global: {
            stubs: {
                Sheet: true,
                SheetContent: true,
                SheetDescription: true,
                SheetFooter: true,
                SheetHeader: true,
                SheetTitle: true,
                Badge: true,
                UserAvatarFallback: true,
                FormFieldAnswerDisplay: true,
            },
        },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    routerGetMock.mockReset();
    routerReloadMock.mockReset();
    routerVisitMock.mockReset();
    putMock.mockReset();
    routerGetMock.mockImplementation((_url, _data, options) => {
        options?.onStart?.();
        return undefined;
    });
    routerReloadMock.mockImplementation((options) => {
        options?.onStart?.();
        return undefined;
    });
    routerVisitMock.mockImplementation((_url, options) => {
        options?.onStart?.();
        return undefined;
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('ActivityLogs skeleton (M2 Task 3)', () => {
    it('ada data + idle → baris fade-up, tanpa skeleton', async () => {
        const wrapper = mountLogs([demoLog('l-1', 'screening.pass')]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('screening.pass');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('ganti filter → 8 skeleton baris + konten hidden + filter visible', async () => {
        const wrapper = mountLogs([demoLog('l-1', 'screening.pass')]);
        try {
            await wrapper.find('select').setValue('per-1');
            await nextTick();

            expect(routerGetMock).toHaveBeenCalledTimes(1);

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            const rows = wrapper.findAll('.log-row-skeleton');
            expect(rows).toHaveLength(8);
            for (const row of rows) {
                expect(row.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            }

            expect(wrapper.text()).not.toContain('screening.pass');

            // Kartu filter tetap terlihat.
            expect(wrapper.find('select').exists()).toBe(true);
            expect(wrapper.find('input[type="search"]').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('navigasi selesai → skeleton hilang + baris fade-up kembali', async () => {
        const wrapper = mountLogs([demoLog('l-1', 'screening.pass')]);
        try {
            await wrapper.find('select').setValue('per-1');
            await nextTick();
            expect(wrapper.findAll('.log-row-skeleton')).toHaveLength(8);

            lastGetOptions().onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('screening.pass');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('logs kosong + idle → empty text, tanpa skeleton/request', async () => {
        const wrapper = mountLogs([]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Tidak ada activity log.');
            expect(routerGetMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Registrants skeleton (M2 Task 3)', () => {
    it('registrants undefined → thead + 10×5 skeleton + pager, tanpa empty state', async () => {
        const wrapper = mountRegistrants(undefined);
        try {
            await nextTick();

            // thead asli tetap (5 kolom).
            const head = wrapper.find('thead');
            expect(head.exists()).toBe(true);
            expect(head.findAll('th')).toHaveLength(5);

            const rows = wrapper.findAll('.reg-row-skeleton');
            expect(rows).toHaveLength(10);
            let cells = 0;
            for (const row of rows) {
                // 5 kolom cermin thead, tiap sel minimal 1 skeleton.
                expect(row.findAll('td')).toHaveLength(5);
                const found = row.findAll('[data-slot="skeleton"]').length;
                expect(found).toBeGreaterThanOrEqual(5);
                cells += found;
            }
            expect(cells).toBeGreaterThanOrEqual(50);

            expect(wrapper.find('.reg-pager-skeleton').exists()).toBe(true);

            // Ringkasan + toolbar tetap; empty state tidak tampil.
            expect(wrapper.text()).toContain('Ringkasan cepat');
            expect(wrapper.text()).toContain('Filter dan pencarian');
            expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false);
            expect(routerGetMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('registrants terisi → tabel fade-up, tanpa skeleton', async () => {
        const wrapper = mountRegistrants([demoRegistrant('r-1', 'Budi Santoso'), demoRegistrant('r-2', 'Siti Aminah')]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.text()).toContain('Siti Aminah');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('filter lokal (ketikan search) → tanpa skeleton, tanpa request', async () => {
        const wrapper = mountRegistrants([demoRegistrant('r-1', 'Budi Santoso'), demoRegistrant('r-2', 'Siti Aminah')]);
        try {
            await wrapper.find('#registrants-search').setValue('budi');
            await nextTick();

            // Filter jalan lokal: 1 baris cocok, skeleton tak pernah muncul.
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.text()).not.toContain('Siti Aminah');
            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(routerGetMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Forms/Show jawaban skeleton (M2 Task 3)', () => {
    it('ada data + idle → tabel fade-up, tanpa skeleton', async () => {
        const wrapper = mountFormsShow([demoSubmission('s-1', 'Budi Santoso')]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
            // Header tab + autosave tetap.
            expect(wrapper.text()).toContain('Jawaban');
        } finally {
            wrapper.unmount();
        }
    });

    it('review → reload submissions → 10 skeleton baris + konten hidden + tab visible', async () => {
        const wrapper = mountFormsShow([demoSubmission('s-1', 'Budi Santoso')]);
        try {
            await reviewButton(wrapper, 'Terima jawaban dari Budi Santoso').trigger('click');
            await new Promise((resolve) => setTimeout(resolve, 0));
            await nextTick();

            expect(routerReloadMock).toHaveBeenCalledTimes(1);
            expect(routerReloadMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ only: ['submissions'] }));

            const region = wrapper.find('[aria-busy="true"]');
            expect(region.exists()).toBe(true);
            expect(region.attributes('aria-label')).toMatch(/memuat/i);

            expect(wrapper.findAll('.jawaban-row-skeleton')).toHaveLength(10);
            expect(wrapper.find('.jawaban-pager-skeleton').exists()).toBe(true);
            expect(wrapper.text()).not.toContain('Budi Santoso');

            // Tab + autosave tidak ikut hilang.
            expect(wrapper.text()).toContain('Jawaban');
        } finally {
            wrapper.unmount();
        }
    });

    it('reload selesai → skeleton hilang + tabel fade-up kembali', async () => {
        const wrapper = mountFormsShow([demoSubmission('s-1', 'Budi Santoso')]);
        try {
            await reviewButton(wrapper, 'Terima jawaban dari Budi Santoso').trigger('click');
            await new Promise((resolve) => setTimeout(resolve, 0));
            await nextTick();
            expect(wrapper.findAll('.jawaban-row-skeleton')).toHaveLength(10);

            const options = lastReloadOptions();
            options.onSuccess?.();
            options.onFinish?.();
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('submissions kosong + idle → empty jawaban, tanpa skeleton', async () => {
        const wrapper = mountFormsShow([]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Belum ada jawaban');
            expect(routerReloadMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });
});

describe('FormAnswerDetailSheet skeleton (M2 Task 3)', () => {
    it('loading → header + 5 field + footer 2 tombol skeleton, tanpa konten', async () => {
        const wrapper = mountSheet(demoSubmission('s-1', 'Budi Santoso'), true);
        try {
            await nextTick();

            expect(wrapper.findAll('.sheet-field-skeleton')).toHaveLength(5);
            expect(wrapper.findAll('.sheet-action-skeleton')).toHaveLength(2);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Budi Santoso');
            expect(wrapper.text()).not.toContain('Terima');
        } finally {
            wrapper.unmount();
        }
    });

    it('siap → konten + 2 tombol review, tanpa skeleton', async () => {
        const wrapper = mountSheet(demoSubmission('s-1', 'Budi Santoso'));
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Budi Santoso');
            expect(wrapper.text()).toContain('Terima');
            expect(wrapper.text()).toContain('Tolak');
        } finally {
            wrapper.unmount();
        }
    });
});
