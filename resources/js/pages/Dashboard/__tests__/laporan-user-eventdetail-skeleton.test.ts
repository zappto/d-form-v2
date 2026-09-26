import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper } from '@vue/test-utils'
import LaporanPage from '../Events/Laporan.vue'
import UserIndex from '../User/Index.vue'
import EventDetailPage from '@/pages/EventDetail.vue'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.5, M2 Task 7 (pola Task 1): skeleton missing-props —
 * ketiga halaman tanpa GET; skeleton HANYA saat props awal belum ada.
 * - Laporan: 3 KPI + panel fokus (ringkasan + tabel + paginasi); kontrol
 *   filter/export tetap terlihat.
 * - User/Index: cermin AKTUAL (3 KPI + upcoming + kalender) — bukan tabel user
 *   versi spec; `pendingInvitations` dead-prop (tak dirender) tanpa skeleton.
 * - EventDetail publik: hero + info + CTA; transisi visible bawaan dipertahankan
 *   (tanpa fade-up ganda).
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    usePage: () => ({
        props: {
            auth: { user: null },
            seo: { siteUrl: 'https://example.com' },
        },
        url: '/events/acara',
    }),
}))

vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }))
vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }))
vi.mock('@/layouts/LandingLayout.vue', () => ({ default: { template: '<slot />' } }))

vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: { template: '<div data-testid="empty-state"><slot /></div>' },
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

function fullLaporanProps(): Record<string, unknown> {
    return {
        globalSummary: { total_events: 5, total_submissions: 120, total_attendance_records: 80 },
        event: demoIEvent('ev-1', 'Acara'),
        exports: { registrations: '/csv/reg', attendance: '/csv/abs' },
        eventReporting: {
            summary: {
                submission_count: 120,
                attended_count: 80,
                attendance_rate_percent: 67,
                registered_count: 10,
                quota: 100,
            },
            attendanceLog: {
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 0,
            },
        },
    }
}

function mountLaporan(props: Record<string, unknown>): VueWrapper {
    return mount(LaporanPage, {
        props: props as unknown as Record<string, never>,
        global: {
            stubs: {
                KpiCard: true,
                EventReportingFocusPanel: true,
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                CardDescription: true,
                Button: true,
                Label: true,
            },
        },
    }) as unknown as VueWrapper
}

function mountUserIndex(props: Record<string, unknown>): VueWrapper {
    return mount(UserIndex, {
        props: props as unknown as Record<string, never>,
        global: {
            stubs: {
                KpiCard: true,
                EventCalendar: true,
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                Badge: true,
                Button: true,
            },
        },
    }) as unknown as VueWrapper
}

function fullUserProps(): Record<string, unknown> {
    return {
        stats: {
            eventsJoined: 3,
            upcomingEvents: 1,
            pendingRegistrations: 0,
            acceptedRegistrations: 2,
        },
        upcomingEvents: [demoIEvent('ev-1', 'Acara A')],
        pendingInvitations: [],
        calendarEvents: [],
    }
}

function mountEventDetail(props: Record<string, unknown>): VueWrapper {
    return mount(EventDetailPage, {
        props: props as unknown as Record<string, never>,
        global: {
            stubs: {
                SeoHead: true,
            },
        },
    }) as unknown as VueWrapper
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Laporan skeleton (M2 Task 7)', () => {
    it('props lengkap → konten fade-up, tanpa skeleton', async () => {
        const wrapper = mountLaporan(fullLaporanProps())
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.find('.fade-up').exists()).toBe(true)
            expect(wrapper.text()).toContain('Registrations CSV')
        } finally {
            wrapper.unmount()
        }
    })

    it('props belum ada → skeleton 3 KPI + panel fokus, kontrol export tetap', async () => {
        const wrapper = mountLaporan({})
        try {
            await nextTick()

            const regions = wrapper.findAll('[aria-busy="true"]')
            expect(regions.length).toBeGreaterThan(0)
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i)
            }

            expect(wrapper.findAll('.kpi-skeleton')).toHaveLength(3)
            expect(wrapper.find('.focus-panel-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('.focus-row-skeleton')).toHaveLength(10)
            expect(wrapper.find('.focus-pager-skeleton').exists()).toBe(true)

            // Kontrol export tidak ikut hilang.
            expect(wrapper.text()).toContain('Registrations CSV')
            expect(wrapper.text()).toContain('Attendance CSV')
        } finally {
            wrapper.unmount()
        }
    })
})

describe('User/Index skeleton (M2 Task 7)', () => {
    it('props lengkap → konten fade-up aktual, tanpa skeleton/tabel-user', async () => {
        const wrapper = mountUserIndex(fullUserProps())
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.find('table').exists()).toBe(false)
            expect(wrapper.text()).toContain('Acara A')
            expect(wrapper.find('.fade-up').exists()).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })

    it('props belum ada → skeleton 3 KPI + upcoming, kalender tetap', async () => {
        const wrapper = mountUserIndex({})
        try {
            await nextTick()

            const regions = wrapper.findAll('[aria-busy="true"]')
            expect(regions.length).toBeGreaterThan(0)
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i)
            }

            expect(wrapper.findAll('.kpi-skeleton')).toHaveLength(3)
            expect(wrapper.findAll('.upcoming-skeleton')).toHaveLength(4)
            expect(wrapper.text()).not.toContain('Acara A')
        } finally {
            wrapper.unmount()
        }
    })
})

describe('EventDetail publik skeleton (M2 Task 7)', () => {
    it('props lengkap → konten + CTA, tanpa skeleton', async () => {
        const wrapper = mountEventDetail({ event: demoIEvent('ev-1', 'Acara A'), memberPortalEventUrl: '/portal' })
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.text()).toContain('Acara A')
            expect(wrapper.text()).toContain('Register Now')
        } finally {
            wrapper.unmount()
        }
    })

    it('event belum ada → skeleton hero + info + CTA, tanpa crash', async () => {
        const wrapper = mountEventDetail({ memberPortalEventUrl: '/portal' })
        try {
            await nextTick()

            const regions = wrapper.findAll('[aria-busy="true"]')
            expect(regions.length).toBeGreaterThan(0)
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i)
            }

            expect(wrapper.find('.hero-skeleton').exists()).toBe(true)
            expect(wrapper.find('.info-skeleton').exists()).toBe(true)
            expect(wrapper.find('.cta-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
        } finally {
            wrapper.unmount()
        }
    })
})
