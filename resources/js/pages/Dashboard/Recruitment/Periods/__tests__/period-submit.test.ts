import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import PeriodCreate from '../Create.vue'
import PeriodEdit from '../Edit.vue'
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message'
import { toast } from 'vue-sonner'
import { routes } from '@/lib/routes'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 6: submit buat/ubah periode —
 * saat processing: CometSpinner 16px + 'Menyimpan...' + disabled + aria-busy="true";
 * Create → flash path (RecruitmentPeriodController::store memakai Inertia::flash('toast')),
 *   sukses TANPA toast manual ganda (global usePageFlashToast yang menampilkan);
 * Edit → manual showFlashToast (update memakai ->with('message') yang tidak dibaca
 *   usePageFlashToast, preseden Task 4 open/close);
 * gagal → handleInertiaFormErrors; submit ganda → satu request.
 */

const { formHolder, postMock, putMock } = vi.hoisted(() => ({
    formHolder: { state: null as Record<string, unknown> | null },
    postMock: vi.fn(),
    putMock: vi.fn(),
}))

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')
    return {
        Head: { template: '<div style="display:none"></div>' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        router: { post: vi.fn(), get: vi.fn(), delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
        useForm: (initial: Record<string, unknown>) => {
            const state = reactive({
                ...initial,
                errors: {},
                processing: false,
                post: postMock,
                put: putMock,
                reset: vi.fn(),
                clearErrors: vi.fn(),
                setError: vi.fn(),
            })
            formHolder.state = state as unknown as Record<string, unknown>
            return state
        },
    }
})

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }))

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
    forceFormData?: boolean
    preserveScroll?: boolean
    onSuccess?: () => void
    onError?: (errors: Record<string, string>) => void
    onFinish?: () => void
}

let lastOptions: InertiaMutationOptions | undefined
let lastMethod: 'post' | 'put' | undefined

function lastMutationOptions(): InertiaMutationOptions {
    if (lastMethod === 'post') expect(postMock).toHaveBeenCalled()
    else expect(putMock).toHaveBeenCalled()
    expect(lastOptions).toBeDefined()
    return lastOptions as InertiaMutationOptions
}

function submitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.find('button[form="period-form"]')
    if (!found.exists()) throw new Error('tombol submit period-form tidak ditemukan')
    return found as DOMWrapper<HTMLButtonElement>
}

function mountCreate(): VueWrapper {
    return mount(PeriodCreate, {
        global: {
            stubs: {
                DatePicker: true,
                SplitDateTimeField: true,
            },
        },
    }) as unknown as VueWrapper
}

const demoPeriod = {
    id: 'per-1',
    name: 'Gelombang 1',
    description: null,
    registration_opens_at: null,
    registration_closes_at: null,
    interview_starts_at: null,
    interview_ends_at: null,
    finalization_deadline_at: null,
    banner_url: null,
}

function mountEdit(): VueWrapper {
    return mount(PeriodEdit, {
        props: { period: demoPeriod },
        global: {
            stubs: {
                DatePicker: true,
                SplitDateTimeField: true,
            },
        },
    }) as unknown as VueWrapper
}

beforeEach(() => {
    vi.clearAllMocks()
    lastOptions = undefined
    lastMethod = undefined
    postMock.mockReset()
    putMock.mockReset()
    postMock.mockImplementation((...args: unknown[]) => {
        lastMethod = 'post'
        lastOptions = args[1] as InertiaMutationOptions | undefined
        const state = formHolder.state
        if (state) state.processing = true
        return undefined
    })
    putMock.mockImplementation((...args: unknown[]) => {
        lastMethod = 'put'
        lastOptions = args[1] as InertiaMutationOptions | undefined
        const state = formHolder.state
        if (state) state.processing = true
        return undefined
    })
})

function finishProcessing(): void {
    const state = formHolder.state
    if (state) state.processing = false
}

describe('Periods/Create submit (Task 6)', () => {
    it('submit → sibuk (spinner + Menyimpan... + disabled + aria-busy) + POST ke URL store', async () => {
        const wrapper = mountCreate()
        try {
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()

            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
            expect(postMock.mock.calls[0]?.[0]).toBe(routes.admin.recruitment.periods.store)

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menyimpan...')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → tanpa toast manual ganda (flash toast server) + tombol pulih', async () => {
        const wrapper = mountCreate()
        try {
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            lastMutationOptions().onSuccess?.()
            // Inertia menyelesaikan request → processing pulih.
            finishProcessing()
            await nextTick()

            expect(toast.success).not.toHaveBeenCalled()
            expect(showFlashToast).not.toHaveBeenCalled()
            expect(handleInertiaFormErrors).not.toHaveBeenCalled()

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Simpan')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → handleInertiaFormErrors + tombol pulih', async () => {
        const wrapper = mountCreate()
        try {
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            lastMutationOptions().onError?.({ name: 'Nama wajib diisi.' })
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { name: 'Nama wajib diisi.' },
                { title: 'Gagal membuat periode' },
            )
            expect(toast.success).not.toHaveBeenCalled()

            finishProcessing()
            await nextTick()
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it('submit ganda saat processing → hanya satu request', async () => {
        const wrapper = mountCreate()
        try {
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})

describe('Periods/Edit submit (Task 6)', () => {
    it('submit → sibuk (spinner + Menyimpan... + disabled + aria-busy) + PUT ke URL update', async () => {
        const wrapper = mountEdit()
        try {
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()

            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            expect(putMock).toHaveBeenCalledTimes(1)
            expect(putMock.mock.calls[0]?.[0]).toBe(routes.admin.recruitment.periods.update('per-1'))

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menyimpan...')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → toast sukses manual (tanpa flash toast server) + tombol pulih', async () => {
        const wrapper = mountEdit()
        try {
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            lastMutationOptions().onSuccess?.()
            finishProcessing()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Periode recruitment berhasil diperbarui.',
            })

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Simpan perubahan')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → handleInertiaFormErrors + tombol pulih', async () => {
        const wrapper = mountEdit()
        try {
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            lastMutationOptions().onError?.({ name: 'Nama wajib diisi.' })
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { name: 'Nama wajib diisi.' },
                { title: 'Gagal memperbarui periode' },
            )
            expect(showFlashToast).not.toHaveBeenCalled()

            finishProcessing()
            await nextTick()
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it('submit ganda saat processing → hanya satu request', async () => {
        const wrapper = mountEdit()
        try {
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()
            await wrapper.find('#period-form').trigger('submit')
            await nextTick()

            expect(putMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})
