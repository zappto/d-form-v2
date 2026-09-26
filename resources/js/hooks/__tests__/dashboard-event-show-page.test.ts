import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useDashboardEventShowPage } from '../useDashboardEventShowPage'
import { handleInertiaFormErrors } from '@/lib/error-message'
import { toast } from 'vue-sonner'

/**
 * Task 8 audit: arsip/pulihkan event dari Events/Show —
 * EventController::destroy/::restore memakai Inertia::flash('toast',
 * messages.event.delete/restore.success) yang tampil global via usePageFlashToast —
 * toast manual `toast.success(humanizeErrorMessage(...))` ganda (pola Task 4 Events
 * delete: archive 'Event berhasil diarsipkan.' vs flash 'event berhasil dihapus';
 * restore identik 'event berhasil dipulihkan') sehingga DIHAPUS; test mengunci:
 * onSuccess → modal tutup + toast.success TIDAK dipanggil.
 * Gagal → handleInertiaFormErrors (dipertahankan).
 */

const { routerDeleteMock, routerPostMock } = vi.hoisted(() => ({
    routerDeleteMock: vi.fn(),
    routerPostMock: vi.fn(),
}))

vi.mock('@inertiajs/vue3', () => ({
    router: {
        post: routerPostMock,
        get: vi.fn(),
        delete: routerDeleteMock,
        reload: vi.fn(),
        visit: vi.fn(),
    },
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

interface RouterMutationOptions {
    onSuccess?: () => void
    onError?: (errors: Record<string, string>) => void
    onFinish?: () => void
}

let lastDeleteOptions: RouterMutationOptions | undefined
let lastPostOptions: RouterMutationOptions | undefined

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

beforeEach(() => {
    vi.clearAllMocks()
    lastDeleteOptions = undefined
    lastPostOptions = undefined
    routerDeleteMock.mockReset()
    routerPostMock.mockReset()
    routerDeleteMock.mockImplementation((...args: unknown[]) => {
        lastDeleteOptions = args[1] as RouterMutationOptions | undefined
        return undefined
    })
    routerPostMock.mockImplementation((...args: unknown[]) => {
        lastPostOptions = args[2] as RouterMutationOptions | undefined
        return undefined
    })
})

describe('useDashboardEventShowPage arsip/pulihkan (Task 8 audit)', () => {
    it('arsip sukses → TANPA toast manual (flash global) + modal tutup', () => {
        const page = useDashboardEventShowPage(demoEvent(), [])

        page.handleDelete()
        expect(routerDeleteMock).toHaveBeenCalledTimes(1)

        lastDeleteOptions?.onSuccess?.()
        lastDeleteOptions?.onFinish?.()

        expect(toast.success).not.toHaveBeenCalled()
        expect(page.showDeleteModal.value).toBe(false)
        expect(page.isDeleting.value).toBe(false)
    })

    it('arsip gagal → handleInertiaFormErrors + tanpa toast sukses', () => {
        const page = useDashboardEventShowPage(demoEvent(), [])

        page.handleDelete()
        lastDeleteOptions?.onError?.({ event: 'Gagal.' })

        expect(handleInertiaFormErrors).toHaveBeenCalledWith(
            { event: 'Gagal.' },
            { title: 'Gagal mengarsipkan event' },
        )
        expect(toast.success).not.toHaveBeenCalled()
    })

    it('pulihkan sukses → TANPA toast manual (flash global) + modal tutup', () => {
        const page = useDashboardEventShowPage(demoEvent(), [])

        page.handleRestore()
        expect(routerPostMock).toHaveBeenCalledTimes(1)

        lastPostOptions?.onSuccess?.()
        lastPostOptions?.onFinish?.()

        expect(toast.success).not.toHaveBeenCalled()
        expect(page.showRestoreModal.value).toBe(false)
        expect(page.isRestoring.value).toBe(false)
    })

    it('pulihkan gagal → handleInertiaFormErrors + tanpa toast sukses', () => {
        const page = useDashboardEventShowPage(demoEvent(), [])

        page.handleRestore()
        lastPostOptions?.onError?.({ event: 'Gagal.' })

        expect(handleInertiaFormErrors).toHaveBeenCalledWith(
            { event: 'Gagal.' },
            { title: 'Gagal memulihkan event' },
        )
        expect(toast.success).not.toHaveBeenCalled()
    })
})
