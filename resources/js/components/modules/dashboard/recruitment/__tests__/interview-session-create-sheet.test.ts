import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import InterviewSessionCreateSheet from '../InterviewSessionCreateSheet.vue'
import { handleInertiaFormErrors } from '@/lib/error-message'
import { toast } from 'vue-sonner'
import { routes } from '@/lib/routes'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 5: submit sheet sesi interview (useForm) —
 * saat processing: CometSpinner 16px + 'Menyimpan...' + disabled + aria-busy;
 * sukses → sheet tutup TANPA toast manual ganda
 * (sukses sudah ditampilkan global via flash `toast` server → usePageFlashToast);
 * gagal → handleInertiaFormErrors + sheet tetap buka; submit ganda → satu request.
 */

const { formHolder, postMock } = vi.hoisted(() => ({
    formHolder: { state: null as Record<string, unknown> | null },
    postMock: vi.fn(),
}))

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')
    return {
        useForm: (initial: Record<string, unknown>) => {
            const state = reactive({
                ...initial,
                errors: {},
                processing: false,
                post: postMock,
                reset: vi.fn(),
                clearErrors: vi.fn(),
            })
            formHolder.state = state as unknown as Record<string, unknown>
            return state
        },
    }
})

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}))

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

interface InertiaMutationOptions {
    preserveScroll?: boolean
    onSuccess?: () => void
    onError?: (errors: Record<string, string>) => void
    onFinish?: () => void
}

let lastOptions: InertiaMutationOptions | undefined

function lastPostOptions(): InertiaMutationOptions {
    expect(postMock).toHaveBeenCalled()
    expect(lastOptions).toBeDefined()
    return lastOptions as InertiaMutationOptions
}

function mountSheet(): VueWrapper {
    return mount(InterviewSessionCreateSheet, {
        props: {
            open: true,
            periodId: 'period-1',
            divisions: [{ id: 'div-1', name: 'Divisi A', code: 'DV' }],
        },
        global: {
            stubs: {
                Sheet: true,
                SheetContent: true,
                SheetHeader: true,
                SheetTitle: true,
                SheetDescription: true,
                SearchableSelect: true,
                DatePicker: true,
                TimeAmPmInput: true,
            },
        },
    }) as unknown as VueWrapper
}

async function fillValid(): Promise<void> {
    const state = formHolder.state
    if (!state) throw new Error('form state belum dibuat')
    Object.assign(state, {
        recruitment_division_id: 'div-1',
        session_date: '2026-10-01',
        starts_at: '09:00',
        ends_at: '12:00',
        location: 'Gedung A',
        room: 'Ruang 1',
    })
    await nextTick()
}

function submitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Buat sesi') || b.text().includes('Menyimpan...'))
    if (!found) throw new Error('tombol submit sheet tidak ditemukan')
    return found as DOMWrapper<HTMLButtonElement>
}

beforeEach(() => {
    vi.clearAllMocks()
    lastOptions = undefined
    postMock.mockReset()
    postMock.mockImplementation((...args: unknown[]) => {
        lastOptions = args[1] as InertiaMutationOptions | undefined
        const state = formHolder.state
        if (state) state.processing = true
        return undefined
    })
})

describe('InterviewSessionCreateSheet submit (Task 5)', () => {
    it('submit valid → sibuk (spinner + Menyimpan... + disabled + aria-busy) + POST', async () => {
        const wrapper = mountSheet()
        try {
            await fillValid()
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()

            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
            expect(postMock.mock.calls[0]?.[0]).toBe(routes.admin.recruitment.interviewSessions.store)

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menyimpan...')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → sheet tutup, tanpa toast manual ganda', async () => {
        const wrapper = mountSheet()
        try {
            await fillValid()
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastPostOptions().onSuccess?.()
            // Inertia menyelesaikan request → processing pulih.
            const state = formHolder.state
            if (state) state.processing = false
            await nextTick()

            expect(wrapper.emitted('close')).toBeTruthy()
            expect(toast.success).not.toHaveBeenCalled()
            expect(handleInertiaFormErrors).not.toHaveBeenCalled()

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Buat sesi')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → handleInertiaFormErrors + sheet tetap buka', async () => {
        const wrapper = mountSheet()
        try {
            await fillValid()
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastPostOptions().onError?.({ location: 'Lokasi wajib diisi.' })
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { location: 'Lokasi wajib diisi.' },
                { title: 'Gagal membuat sesi interview' },
            )
            expect(wrapper.emitted('close')).toBeFalsy()

            const state = formHolder.state
            if (state) state.processing = false
            await nextTick()
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
            expect(wrapper.emitted('close')).toBeFalsy()
        } finally {
            wrapper.unmount()
        }
    })

    it('submit ganda saat processing → hanya satu request', async () => {
        const wrapper = mountSheet()
        try {
            await fillValid()
            await wrapper.find('form').trigger('submit')
            await nextTick()
            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})
