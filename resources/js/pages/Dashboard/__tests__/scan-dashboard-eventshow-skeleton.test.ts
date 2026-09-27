import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper } from '@vue/test-utils'
import QrScanSidebar from '@/components/modules/dashboard/QrScanSidebar.vue'
import DashboardIndex from '../Index.vue'
import EventsShow from '../Events/Show.vue'
import type { ScanResult } from '@/lib/qrScanUi'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.5, M2 Task 6 (pola Task 1): skeleton GET —
 * - Scan: viewfinder fisik tak disentuh; panel HASIL ("Hasil Scan Terakhir")
 *   jadi skeleton saat `scanBusy` (feed/scan sibuk), hasil basi disembunyikan.
 * - Dashboard/Index: tanpa GET (props saja) → skeleton HANYA untuk props awal
 *   yang belum ada (4 stat + recent + 2 chart); kalender selalu tampil.
 * - Events/Show: props event belum ada → skeleton hero + 3 kartu kiri + aside;
 *   2 ConfirmationModal M1 tak disentuh. Tab tak ada di halaman ini.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
}))

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }))
vi.mock('@/layouts/DashboardFocusLayout.vue', () => ({ default: { template: '<slot />' } }))

vi.mock('@/components/modules/dashboard/EmptyState.vue', () => ({
    default: { template: '<div data-testid="empty-state"><slot /></div>' },
}))

// Kalender Admin Dashboard kini konsumen data nyata (Mx-D); assert props tanpa
// memuat dependency berat (Dialog/Card/dummyData).
vi.mock('@/components/modules/dashboard/EventCalendar.vue', () => ({
    default: {
        name: 'EventCalendar',
        props: { events: { type: Array, default: () => [] } },
        template: '<div data-testid="event-calendar" :data-count="events.length" />',
    },
}))

function demoScanResult(): ScanResult {
    return {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        status: 'success',
        source: 'camera',
        rawCode: 'OPREC-2026-00001',
        eventKind: 'event',
        eventTitle: 'Acara',
        queueNumber: null,
    }
}

function mountSidebar(scanResult: ScanResult | null, scanBusy: boolean): VueWrapper {
    return mount(QrScanSidebar, {
        props: {
            scanResult,
            scanHistory: [],
            logEntries: [],
            registrationCodeInput: '',
            scanBusy,
        },
        global: {
            stubs: {
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                Button: true,
                Badge: true,
                Input: true,
            },
        },
    }) as unknown as VueWrapper
}

function demoStats(): Record<string, number> {
    return { totalEvents: 5, activeEvents: 3, totalRegistrants: 120, completionRate: 60 }
}

function mountDashboardIndex(props: Record<string, unknown>): VueWrapper {
    return mount(DashboardIndex, {
        props: props as unknown as Record<string, never>,
        global: {
            stubs: {
                KpiCard: true,
                RecentEventsCard: true,
                RegistrationChart: true,
                CategoryChart: true,
            },
        },
    }) as unknown as VueWrapper
}

function fullDashboardProps(): Record<string, unknown> {
    return {
        recentEvents: [],
        calendarEvents: [
            { id: 'ev-1', title: 'Acara', start_date: '2026-10-01', end_date: null, category: 'rkt', href: '/admin/events/ev-1' },
        ],
        stats: demoStats(),
        adminCharts: { registrationTrend: [], categoryBreakdown: [] },
    }
}

function demoIEvent(): IEvent {
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

function mountEventsShow(props: Record<string, unknown>): VueWrapper {
    return mount(EventsShow, {
        props: props as unknown as Record<string, never>,
        global: {
            stubs: {
                EventShowHeroSection: true,
                EventShowRegistrationPulseCard: true,
                EventShowAboutCard: true,
                EventShowRegistrantsPreviewCard: true,
                EventShowAsideRail: true,
                ConfirmationModal: true,
                TooltipProvider: true,
            },
        },
    }) as unknown as VueWrapper
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('QrScanSidebar panel hasil (M2 Task 6)', () => {
    it('idle tanpa hasil → pesan kosong, tanpa skeleton', async () => {
        const wrapper = mountSidebar(null, false)
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.text()).toContain('Belum ada scan')
        } finally {
            wrapper.unmount()
        }
    })

    it('sibuk → skeleton hasil + hasil basi hidden + kartu manual visible', async () => {
        const wrapper = mountSidebar(demoScanResult(), true)
        try {
            await nextTick()

            const region = wrapper.find('[aria-busy="true"]')
            expect(region.exists()).toBe(true)
            expect(region.attributes('aria-label')).toMatch(/memuat/i)

            expect(wrapper.find('.scan-result-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)

            // Hasil basi disembunyikan selama sibuk.
            expect(wrapper.text()).not.toContain('Budi Santoso')
            expect(wrapper.text()).not.toContain('Belum ada scan')

            // Kartu input manual tidak ikut skeleton.
            expect(wrapper.text()).toContain('Input Manual')
        } finally {
            wrapper.unmount()
        }
    })

    it('selesai → hasil tampil, skeleton hilang', async () => {
        const wrapper = mountSidebar(demoScanResult(), false)
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.text()).toContain('Budi Santoso')
            expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })
})

describe('Dashboard/Index skeleton (M2 Task 6)', () => {
    it('props lengkap → konten fade-up, tanpa skeleton', async () => {
        const wrapper = mountDashboardIndex(fullDashboardProps())
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.find('.fade-up').exists()).toBe(true)
            expect(wrapper.text()).toContain('Metrik utama')
        } finally {
            wrapper.unmount()
        }
    })

    it('props belum ada → skeleton 4 stat + recent + 2 chart, kalender tetap', async () => {
        const wrapper = mountDashboardIndex({})
        try {
            await nextTick()

            const regions = wrapper.findAll('[aria-busy="true"]')
            expect(regions.length).toBeGreaterThan(0)
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i)
            }

            expect(wrapper.findAll('.kpi-skeleton')).toHaveLength(4)
            expect(wrapper.find('.recent-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('.chart-skeleton')).toHaveLength(2)

            // Kalender data nyata selalu tampil; section duplikat 'Linimasa acara' dihapus (Mx-D).
            expect(wrapper.text()).toContain('Aktivitas & kalender')
            expect(wrapper.find('[data-testid="event-calendar"]').exists()).toBe(true)
            expect(wrapper.text()).not.toContain('Linimasa acara')
            expect(wrapper.find('[data-testid="mini-calendar"]').exists()).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })

    it('kalender memakai calendarEvents & kalender dummy tidak dirender (Mx-D)', async () => {
        const wrapper = mountDashboardIndex(fullDashboardProps())
        try {
            await nextTick()

            const calendar = wrapper.find('[data-testid="event-calendar"]')
            expect(calendar.exists()).toBe(true)
            expect(calendar.attributes('data-count')).toBe('1')
            expect(wrapper.find('[data-testid="mini-calendar"]').exists()).toBe(false)
            expect(wrapper.text()).not.toContain('Linimasa acara')
        } finally {
            wrapper.unmount()
        }
    })

    it('adminCharts null → chart hidden tanpa skeleton', async () => {
        const wrapper = mountDashboardIndex({ ...fullDashboardProps(), adminCharts: null })
        try {
            await nextTick()

            expect(wrapper.findAll('.chart-skeleton')).toHaveLength(0)
            expect(wrapper.text()).not.toContain('Analitik singkat')
        } finally {
            wrapper.unmount()
        }
    })
})

describe('Events/Show skeleton (M2 Task 6)', () => {
    it('props lengkap → konten fade-up, tanpa skeleton, modal M1 utuh', async () => {
        const wrapper = mountEventsShow({ event: demoIEvent(), forms: [] })
        try {
            await nextTick()

            expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(0)
            expect(wrapper.find('.fade-up').exists()).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })

    it('event belum ada → skeleton hero + 3 kartu kiri + aside', async () => {
        const wrapper = mountEventsShow({})
        try {
            await nextTick()

            const regions = wrapper.findAll('[aria-busy="true"]')
            expect(regions.length).toBeGreaterThan(0)
            for (const region of regions) {
                expect(String(region.attributes('aria-label'))).toMatch(/memuat/i)
            }

            expect(wrapper.find('.hero-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('.detail-card-skeleton')).toHaveLength(3)
            expect(wrapper.find('.aside-skeleton').exists()).toBe(true)
            expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
        } finally {
            wrapper.unmount()
        }
    })
})
