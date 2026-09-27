import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper } from '@vue/test-utils'
import PublicEventPage from '@/pages/Event.vue'
import FormsIndex from '../Events/Forms/Index.vue'
import EventsEdit from '../Events/Edit.vue'
import ConfirmationModal from '@/components/core/ConfirmationModal.vue'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.5/§7.2, M2 Task 11 (pola Task 1): skeleton missing-props —
 * - Event.vue publik: hero tetap; highlight (3) + list (5 baris) skeleton;
 *   tanpa pagination (tak ada di markup).
 * - Forms/Index: header event tetap; 4 kartu form skeleton; modal hapus M1
 *   tak disentuh (tertutup).
 * - Events/Edit: wrapper tipis; skeleton field-edit + aside-preview di page,
 *   komponen form tak direstruktur; logika submit M1 read-only.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
    usePage: () => ({
        props: {
            auth: { user: null },
            seo: { siteUrl: 'https://example.com', siteName: 'DForm' },
        },
        url: '/events',
    }),
}))

vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }))
vi.mock('@/layouts/LandingLayout.vue', () => ({ default: { template: '<slot />' } }))

vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: { template: '<div data-testid="empty-state"><slot /></div>' },
}))

vi.mock('vue3-lottie', () => ({
    Vue3Lottie: { template: '<div />' },
}))

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}))

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

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
    }
}

/** Tipe props diturunkan dari komponen agar fixture tak menduplikasi bentuk. */
type TPublicEventProps = InstanceType<typeof PublicEventPage>['$props']

function mountPublicEvent(
    events: TPublicEventProps['events'],
): VueWrapper<InstanceType<typeof PublicEventPage>> {
    return mount(PublicEventPage, {
        props: { events },
        global: {
            stubs: {
                SeoHead: true,
                EventHero: true,
                EventHighlight: true,
                EventList: true,
            },
        },
    })
}

function demoIForm(id: string, title: string): IForm {
    return {
        id,
        title,
        description: 'Deskripsi',
        visible_for: [],
        closed_at: '',
        event_id: 'ev-1',
        banner_url: null,
        banner_caption: null,
    }
}

/** Tipe props diturunkan dari komponen agar fixture tak menduplikasi bentuk. */
type TFormsIndexProps = InstanceType<typeof FormsIndex>['$props']

function mountFormsIndex(
    event: TFormsIndexProps['event'],
    forms: TFormsIndexProps['forms'],
): VueWrapper<InstanceType<typeof FormsIndex>> {
    return mount(FormsIndex, {
        props: { event, forms },
        global: {
            stubs: {
                Card: true,
                CardContent: true,
                Button: true,
                Badge: true,
                ConfirmationModal: true,
            },
        },
    })
}

/** Tipe props diturunkan dari komponen agar fixture tak menduplikasi bentuk. */
type TEventsEditProps = InstanceType<typeof EventsEdit>['$props']

function mountEventsEdit(
    event: TEventsEditProps['event'],
): VueWrapper<InstanceType<typeof EventsEdit>> {
    return mount(EventsEdit, {
        props: { event, options: { categories: [], sessions: [] } },
        global: {
            stubs: {
                EventDashboardForm: true,
            },
        },
    })
}

function busyRegions(wrapper: VueWrapper): void {
    const regions = wrapper.findAll('[aria-busy="true"]')
    expect(regions.length).toBeGreaterThan(0)
    for (const region of regions) {
        expect(String(region.attributes('aria-label'))).toMatch(/memuat/i)
    }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Event.vue publik skeleton (M2 Task 11)', () => {
    it('props lengkap → highlight + list (reveal bawaan), tanpa skeleton/pagination', async () => {
        const wrapper = mountPublicEvent([demoIEvent('ev-1', 'Acara A')])
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
        } finally {
            wrapper.unmount()
        }
    })

    it('events belum ada → hero tetap + skeleton highlight/list, tanpa crash', async () => {
        const wrapper = mountPublicEvent(undefined)
        try {
            await nextTick()

            busyRegions(wrapper)
            expect(wrapper.findAll('.highlight-card-skeleton')).toHaveLength(3)
            expect(wrapper.findAll('.event-row-skeleton')).toHaveLength(5)
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
        } finally {
            wrapper.unmount()
        }
    })
})

describe('Forms/Index skeleton (M2 Task 11)', () => {
    it('props lengkap → grid fade-up + modal M1 tertutup, tanpa skeleton', async () => {
        const wrapper = mountFormsIndex({ id: 'ev-1', title: 'Acara' }, [demoIForm('fo-1', 'Formulir A')])
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.text()).toContain('Formulir A')
            expect(wrapper.find('.fade-up').exists()).toBe(true)
            expect(wrapper.findComponent(ConfirmationModal).props('open')).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })

    it('props belum ada → header tetap + 4 kartu skeleton + modal tertutup', async () => {
        const wrapper = mountFormsIndex(undefined, undefined)
        try {
            await nextTick()

            busyRegions(wrapper)
            expect(wrapper.findAll('.form-card-skeleton')).toHaveLength(4)
            expect(wrapper.text()).toContain('Create Form')
            expect(wrapper.text()).not.toContain('Formulir A')
            expect(wrapper.findComponent(ConfirmationModal).props('open')).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })
})

describe('Events/Edit skeleton (M2 Task 11)', () => {
    it('props lengkap → form + fade-up, tanpa skeleton', async () => {
        const wrapper = mountEventsEdit(demoIEvent('ev-1', 'Acara A'))
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.find('.fade-up').exists()).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })

    it('props belum ada → skeleton field + preview, form tak dirender', async () => {
        const wrapper = mountEventsEdit(undefined)
        try {
            await nextTick()

            busyRegions(wrapper)
            expect(wrapper.find('.edit-fields-skeleton').exists()).toBe(true)
            expect(wrapper.find('.edit-preview-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
        } finally {
            wrapper.unmount()
        }
    })
})
