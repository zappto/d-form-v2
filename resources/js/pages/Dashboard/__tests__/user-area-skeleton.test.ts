import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper } from '@vue/test-utils';
import UserEventDetail from '../User/EventDetail.vue';
import UserEventRegistration from '../User/EventRegistration.vue';
import UserEventRegistrationPickForm from '../User/EventRegistrationPickForm.vue';
import UserTeamInvitation from '../User/TeamInvitation.vue';
import UserEvents from '../User/Events.vue';
import ProfilePage from '../Profile.vue';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';

/** Tipe baris form picker diturunkan dari props komponen agar fixture tak menduplikasi bentuk. */
type TPickFormRow = NonNullable<InstanceType<typeof UserEventRegistrationPickForm>['$props']['forms']>[number];

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.5/§7.2, M2 Task 10 (pola Task 1): skeleton missing-props area user —
 * tanpa GET di semua halaman ini; skeleton HANYA saat props awal belum ada.
 * - EventDetail: hero + status + undangan + forms + QR.
 * - EventRegistration: status + jawaban + QR + bundle.
 * - PickForm: banner statis tetap + 3 kartu form.
 * - TeamInvitation: NON-MODAL saja (modal/dialog M1 tak disentuh).
 * - Events: filter lokal; skeleton grid per tab (mine/browse), tanpa partial.
 * - Profile: user null → skeleton; logika save/toast M1 tak disentuh.
 */

const { postedCalls, formStates, createdCounter, mockAuthUser } = vi.hoisted(() => ({
    postedCalls: [] as Array<{ tag: string; url: string }>,
    formStates: [] as Array<{ tag: string; state: { processing: boolean } }>,
    createdCounter: { count: 0 },
    mockAuthUser: {
        value: {
            id: 'u-1',
            name: 'Budi Santoso',
            email: 'budi@example.com',
            avatar: null,
            has_local_password: true,
        } as IUser | null,
    },
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        Head: { template: '<div style="display:none"></div>' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        router: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
        usePage: () => ({
            props: {
                auth: { user: mockAuthUser.value },
            },
            url: '/dashboard',
        }),
        useForm: <T extends object>(initial: T) => {
            createdCounter.count += 1;
            const tag = `form-${createdCounter.count}`;
            const errors = reactive<Record<string, string>>({});
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: (url: string) => {
                    state.processing = true;
                    postedCalls.push({ tag, url });
                    return undefined;
                },
                transform: () => ({ post: state.post }),
                reset: vi.fn(),
                clearErrors: vi.fn(),
                defaults: vi.fn(),
                dontRemember: () => state,
            });
            formStates.push({ tag, state });
            return state;
        },
    };
});

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));
vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }));

/** EmptyState menarik LocalLottie → vue3-lottie → lottie-web yang crash di jsdom. */
vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: {
        props: ['title', 'description'],
        template:
            '<div data-testid="empty-state"><p>{{ title }}</p><p v-if="description">{{ description }}</p><slot /></div>',
    },
}));
vi.mock('vue3-lottie', () => ({
    Vue3Lottie: { template: '<div />' },
}));

vi.mock('@/lib/error-message', () => ({
    buildFieldLabelMap: () => ({}),
    getFieldError: () => undefined,
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

function demoIEvent(id: string, title: string): IEvent {
    return {
        id,
        slug: `acara-${id}`,
        title,
        description: '<p>Deskripsi acara.</p>',
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

const UI_STUBS = {
    Card: true,
    CardContent: true,
    CardHeader: true,
    CardTitle: true,
    CardDescription: true,
    Badge: true,
    Button: true,
    Label: true,
    Input: true,
    Progress: true,
} as const;

function busyRegions(wrapper: VueWrapper): void {
    const regions = wrapper.findAll('[aria-busy="true"]');
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) {
        expect(String(region.attributes('aria-label'))).toMatch(/memuat/i);
    }
}

beforeEach(() => {
    vi.clearAllMocks();
    postedCalls.length = 0;
    formStates.length = 0;
    createdCounter.count = 0;
});

describe('User/EventDetail skeleton (M2 Task 10)', () => {
    function mountDetail(event: IEvent | undefined): VueWrapper<InstanceType<typeof UserEventDetail>> {
        return mount(UserEventDetail, {
            props: {
                event,
                isRegistered: false,
                registrationStatus: null,
                qr_base64: null,
                registration_code: null,
                participantForms: [],
            },
            global: {
                stubs: {
                    ...UI_STUBS,
                    EventBannerImage: true,
                    TiptapRichHtml: true,
                },
            },
        });
    }

    it('props lengkap → konten fade-up, tanpa skeleton', async () => {
        const wrapper = mountDetail(demoIEvent('ev-1', 'Acara A'));
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Tentang acara');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('event belum ada → skeleton semua zona, tanpa crash', async () => {
        const wrapper = mountDetail(undefined);
        try {
            await nextTick();

            busyRegions(wrapper);
            expect(wrapper.find('.hero-skeleton').exists()).toBe(true);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Tentang acara');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('User/EventRegistration skeleton (M2 Task 10)', () => {
    function mountRegistration(event: IEvent | undefined): VueWrapper<InstanceType<typeof UserEventRegistration>> {
        return mount(UserEventRegistration, {
            props: {
                event,
                form: { id: 'fo-1', title: 'Formulir A', registration_mode: 'single', success_content: null },
                registration: {
                    review_status: 'pending',
                    submitted_at: '2026-01-01T10:00:00+07:00',
                    reviewed_at: null,
                    registration_code: null,
                    registration_role: null,
                    answers_summary: { Nama: 'Budi Santoso' },
                    qr_base64: null,
                },
                bundle_participants: [],
            },
            global: { stubs: { ...UI_STUBS, EventBannerImage: true, TiptapRichHtml: true } },
        });
    }

    it('props lengkap → konten fade-up, tanpa skeleton', async () => {
        const wrapper = mountRegistration(demoIEvent('ev-1', 'Acara A'));
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Your answers');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('event belum ada → skeleton + tautan footer tetap, tanpa crash', async () => {
        const wrapper = mountRegistration(undefined);
        try {
            await nextTick();

            busyRegions(wrapper);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Your answers');
            // Tautan footer butuh slug event → ikut tersembunyi saat missing.
            expect(wrapper.text()).not.toContain('Back to event details');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('User/EventRegistrationPickForm skeleton (M2 Task 10)', () => {
    function mountPickForm(
        event: IEvent | undefined,
        forms: TPickFormRow[] | undefined
    ): VueWrapper<InstanceType<typeof UserEventRegistrationPickForm>> {
        return mount(UserEventRegistrationPickForm, {
            props: { event, forms },
            global: { stubs: UI_STUBS },
        });
    }

    function demoFormRow(): TPickFormRow {
        return {
            id: 'fo-1',
            title: 'Formulir A',
            description: 'Deskripsi',
            fill_url: '/fill/fo-1',
            access_status: 'allowed',
            access_message: '',
            can_start: true,
        };
    }

    it('props lengkap → daftar form fade-up, tanpa skeleton', async () => {
        const wrapper = mountPickForm(demoIEvent('ev-1', 'Acara A'), [demoFormRow()]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Formulir A');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('props belum ada → banner statis + 3 kartu skeleton', async () => {
        const wrapper = mountPickForm(undefined, undefined);
        try {
            await nextTick();

            busyRegions(wrapper);
            expect(wrapper.text()).toContain('Anda hanya bisa mengirim satu formulir');
            expect(wrapper.findAll('.form-card-skeleton')).toHaveLength(3);
            expect(wrapper.text()).not.toContain('Formulir A');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('User/TeamInvitation skeleton (M2 Task 10)', () => {
    function mountInvitation(withData: boolean): VueWrapper<InstanceType<typeof UserTeamInvitation>> {
        return mount(UserTeamInvitation, {
            props: {
                event: withData ? { id: 'ev-1', slug: 'acara', title: 'Acara' } : undefined,
                form: withData ? { id: 'fo-1', title: 'Formulir' } : undefined,
                fields: withData ? [] : undefined,
                answers: {},
                leader: { name: 'Ketua', email: 'ketua@example.com' },
                alreadyConfirmed: false,
                confirmUrl: '/invitation/token-abc',
            },
            global: {
                stubs: {
                    ...UI_STUBS,
                    DatePicker: true,
                    Checkbox: true,
                    SearchableSelect: true,
                    Textarea: true,
                    FormParagraphContent: true,
                    FormFieldAnswerDisplay: true,
                    ConfirmationModal: true,
                    AlertDialog: true,
                    AlertDialogAction: true,
                    AlertDialogCancel: true,
                    AlertDialogContent: true,
                    AlertDialogDescription: true,
                    AlertDialogFooter: true,
                    AlertDialogHeader: true,
                    AlertDialogTitle: true,
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

    it('props lengkap → ringkasan + aksi non-modal, tanpa skeleton', async () => {
        const wrapper = mountInvitation(true);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Accept invitation');
            expect(wrapper.text()).toContain('Decline');
        } finally {
            wrapper.unmount();
        }
    });

    it('props belum ada → skeleton non-modal + modal M1 tertutup, tanpa crash', async () => {
        const wrapper = mountInvitation(false);
        try {
            await nextTick();

            busyRegions(wrapper);
            expect(wrapper.findAll('.field-skeleton')).toHaveLength(3);
            expect(wrapper.text()).not.toContain('Accept invitation');

            // Modal + dialog M1 tak tersentuh: tetap tertutup.
            expect(wrapper.findComponent(ConfirmationModal).props('open')).toBe(false);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('User/Events skeleton (M2 Task 10)', () => {
    function mountEvents(
        listMode: 'mine' | 'browse',
        events: IEvent[] | undefined
    ): VueWrapper<InstanceType<typeof UserEvents>> {
        return mount(UserEvents, {
            props: { listMode, events },
            global: {
                stubs: {
                    ...UI_STUBS,
                    EventFilterBar: true,
                    EventCard: true,
                    EmptyState: true,
                },
            },
        });
    }

    it.each(['mine', 'browse'] as const)('tab %s terisi → grid fade-up, tanpa skeleton', async (listMode) => {
        const wrapper = mountEvents(listMode, [demoIEvent('ev-1', 'Acara A')]);
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it.each(['mine', 'browse'] as const)('tab %s kosong-props → 6 skeleton + filter tetap', async (listMode) => {
        const wrapper = mountEvents(listMode, undefined);
        try {
            await nextTick();

            busyRegions(wrapper);
            expect(wrapper.findAll('.event-card-skeleton')).toHaveLength(6);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Profile skeleton (M2 Task 10)', () => {
    const fullUser: IUser = {
        id: 'u-1',
        name: 'Budi Santoso',
        email: 'budi@example.com',
        avatar: null,
        has_local_password: true,
    };

    function mountProfile(): VueWrapper<InstanceType<typeof ProfilePage>> {
        return mount(ProfilePage, {
            global: {
                stubs: {
                    ...UI_STUBS,
                    UserAvatarFallback: true,
                },
            },
        });
    }

    it('user login → konten + tombol simpan, tanpa skeleton', async () => {
        mockAuthUser.value = { ...fullUser };
        const wrapper = mountProfile();
        try {
            await nextTick();

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0);
            expect(wrapper.text()).toContain('Foto Profil');
            expect(wrapper.text()).toContain('Simpan Perubahan');
            expect(wrapper.find('.fade-up').exists()).toBe(true);
        } finally {
            wrapper.unmount();
            mockAuthUser.value = { ...fullUser };
        }
    });

    it('user belum ada → skeleton semua zona + logika save tak tersentuh', async () => {
        mockAuthUser.value = null;
        const wrapper = mountProfile();
        try {
            await nextTick();

            busyRegions(wrapper);
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
            expect(wrapper.text()).not.toContain('Foto Profil');
            expect(wrapper.text()).not.toContain('Simpan Perubahan');
            expect(postedCalls).toHaveLength(0);
        } finally {
            wrapper.unmount();
            mockAuthUser.value = { ...fullUser };
        }
    });
});
