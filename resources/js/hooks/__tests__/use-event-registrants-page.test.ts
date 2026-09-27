import { describe, expect, it } from 'vitest'
import { useEventRegistrantsPage } from '../useEventRegistrantsPage'

/**
 * M5 closeout: pin perilaku useEventRegistrantsPage (filter tab + form,
 * pencarian, hitung status, kartu statistik) agar migrasi sisa tak menggeser
 * semantik tampilan halaman pendaftar.
 */

function demoRegistrants(): IRegistrant[] {
    return [
        {
            id: 'r-1',
            form_id: 'f-1',
            form: { id: 'f-1', title: 'Formulir A' },
            user: { id: 'u-1', name: 'Budi Santoso', email: 'budi@example.com', avatar: null },
            event_id: 'ev-1',
            status: 'pending',
            submitted_at: '2026-09-10',
            answers: {},
            registration_code: 'REG-001',
            reviewed_at: null,
        },
        {
            id: 'r-2',
            form_id: 'f-2',
            form: { id: 'f-2', title: 'Formulir B' },
            user: { id: 'u-2', name: 'Sari Wulandari', email: 'sari@example.com', avatar: null },
            event_id: 'ev-1',
            status: 'accepted',
            submitted_at: '2026-09-11',
            answers: {},
            registration_code: 'REG-002',
            reviewed_at: '2026-09-12',
        },
        {
            id: 'r-3',
            form_id: 'f-1',
            form: { id: 'f-1', title: 'Formulir A' },
            user: { id: 'u-3', name: 'Agus Pratama', email: 'agus@example.com', avatar: null },
            event_id: 'ev-1',
            status: 'rejected',
            submitted_at: '2026-09-12',
            answers: {},
            registration_code: null,
            reviewed_at: '2026-09-13',
        },
    ]
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

function demoForms(): { id: string; title: string }[] {
    return [
        { id: 'f-1', title: 'Formulir A' },
        { id: 'f-2', title: 'Formulir B' },
    ]
}

describe('useEventRegistrantsPage (pin M5)', () => {
    it('hitung status: all/pending/accepted/rejected', () => {
        const page = useEventRegistrantsPage({
            event: demoEvent(),
            forms: demoForms(),
            registrants: demoRegistrants(),
        })
        expect(page.statusCounts.value).toEqual({ all: 3, pending: 1, accepted: 1, rejected: 1 })
        expect(page.pendingCount.value).toBe(1)
    })

    it('tab status + filter form menyaring daftar', () => {
        const page = useEventRegistrantsPage({
            event: demoEvent(),
            forms: demoForms(),
            registrants: demoRegistrants(),
        })
        expect(page.filteredRegistrants.value).toHaveLength(3)
        page.setStatTab('pending')
        expect(page.filteredRegistrants.value.map((r) => r.id)).toEqual(['r-1'])
        page.setStatTab('all')
        page.activeFormFilter.value = 'f-1'
        expect(page.filteredRegistrants.value.map((r) => r.id)).toEqual(['r-1', 'r-3'])
    })

    it('pencarian cocok nama/email/kode, clearFilters mengembalikan semua', () => {
        const page = useEventRegistrantsPage({
            event: demoEvent(),
            forms: demoForms(),
            registrants: demoRegistrants(),
        })
        page.searchQuery.value = 'sari'
        expect(page.filteredRegistrants.value.map((r) => r.id)).toEqual(['r-2'])
        page.searchQuery.value = 'REG-001'
        expect(page.filteredRegistrants.value.map((r) => r.id)).toEqual(['r-1'])
        page.clearFilters()
        expect(page.filteredRegistrants.value).toHaveLength(3)
        expect(page.searchQuery.value).toBe('')
        expect(page.activeStatusTab.value).toBe('all')
    })

    it('kartu statistik: 4 kartu, nilai ikut hitung, helper approvalRate', () => {
        const page = useEventRegistrantsPage({
            event: demoEvent(),
            forms: demoForms(),
            registrants: demoRegistrants(),
        })
        const cards = page.statCards.value
        expect(cards.map((c) => c.key)).toEqual(['all', 'pending', 'accepted', 'rejected'])
        expect(cards.map((c) => c.value)).toEqual([3, 1, 1, 1])
        expect(cards[2]?.helper).toBe('50% dari yang sudah diputus')
    })
})
