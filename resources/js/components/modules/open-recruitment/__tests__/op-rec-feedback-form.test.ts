import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import OpRecFeedbackForm from '../OpRecFeedbackForm.vue'
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 7: submit feedback —
 * saat processing: CometSpinner 16px + swap 'Mengirim...' + disabled + aria-busy="true";
 * sukses → showFlashToast manual (FeedbackController::store memakai ->with('toast')
 * sesi biasa yang tidak dibaca usePageFlashToast — hanya inertia.flash_data yang
 * terbaca, preseden Task 6 Ruling 3) + reset + emit success;
 * gagal → handleInertiaFormErrors; submit ganda → satu request.
 * Swap: 'Mengirim...' dipertahankan (aksi bertipe kirim, sudah ada sebelum Task 7).
 */

const { formHolder, postMock } = vi.hoisted(() => ({
    formHolder: { state: null as Record<string, unknown> | null },
    postMock: vi.fn(),
}))

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')
    return {
        useForm: (initial: Record<string, unknown>) => {
            const errors = reactive<Record<string, string>>({})
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: postMock,
                reset: vi.fn(() => {
                    Object.assign(state, initial)
                }),
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

function mountForm(): VueWrapper {
    return mount(OpRecFeedbackForm, {
        props: { storeUrl: '/recruitment/track/feedback' },
    }) as unknown as VueWrapper
}

function submitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Kirim feedback') || b.text().includes('Mengirim...'))
    if (!found) throw new Error('tombol kirim feedback tidak ditemukan')
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

function finishProcessing(): void {
    const state = formHolder.state
    if (state) state.processing = false
}

describe('OpRecFeedbackForm submit (Task 7)', () => {
    it("kirim → sibuk (spinner + 'Mengirim...' + disabled + aria-busy) + POST ke storeUrl", async () => {
        const wrapper = mountForm()
        try {
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()

            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
            expect(postMock.mock.calls[0]?.[0]).toBe('/recruitment/track/feedback')

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Mengirim...')
            expect(btn.text()).not.toContain('…')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → toast sukses manual + reset + emit success + tombol pulih', async () => {
        const wrapper = mountForm()
        try {
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastPostOptions().onSuccess?.()
            finishProcessing()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Terima kasih! Feedback kamu telah kami terima.',
            })
            expect(wrapper.emitted('success')).toHaveLength(1)

            const btn = submitButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Kirim feedback')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → handleInertiaFormErrors + tanpa toast sukses + tombol pulih', async () => {
        const wrapper = mountForm()
        try {
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastPostOptions().onError?.({ feedback: 'Feedback tidak valid.' })
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { feedback: 'Feedback tidak valid.' },
                { title: 'Gagal mengirim feedback' },
            )
            expect(showFlashToast).not.toHaveBeenCalled()
            expect(wrapper.emitted('success')).toBeUndefined()

            finishProcessing()
            await nextTick()
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it('kirim ganda saat processing → hanya satu request', async () => {
        const wrapper = mountForm()
        try {
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
