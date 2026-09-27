import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import TrackEdit from '../Edit.vue'
import TrackShow from '../Show.vue'
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 6: submit ubah pendaftaran + kirim koreksi —
 * saat processing: CometSpinner 16px + swap teks + disabled + aria-busy="true";
 * sukses → showFlashToast manual (TrackingController::update dan
 * CorrectionRequestController::store memakai ->with('toast') sesi biasa yang
 * tidak dibaca usePageFlashToast — hanya inertia.flash_data yang terbaca,
 * preseden Task 4 open/close);
 * gagal → handleInertiaFormErrors; submit ganda → satu request.
 * Swap: ubah pendaftaran → 'Menyimpan...' (normalisasi '…' satu karakter);
 * kirim koreksi → 'Mengirim...' (aksi bertipe kirim).
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
        router: {
            post: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            reload: vi.fn(),
            visit: vi.fn(),
        },
        useForm: (initial: Record<string, unknown>) => {
            const errors = reactive<Record<string, string>>({})
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: postMock,
                put: putMock,
                reset: vi.fn(() => {
                    Object.assign(state, initial)
                }),
                clearErrors: vi.fn((...fields: string[]) => {
                    if (fields.length === 0) {
                        for (const key of Object.keys(errors)) delete errors[key]
                        return
                    }
                    for (const field of fields) delete errors[field]
                }),
                setError: vi.fn((field: string, message: string) => {
                    errors[field] = message
                }),
            })
            formHolder.state = state as unknown as Record<string, unknown>
            return state
        },
    }
})

vi.mock('@/layouts/FormFillLayout.vue', () => ({ default: { template: '<slot />' } }))

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

const demoApplication = {
    full_name: 'Ayu Lestari',
    nim: 'A11.2023.12345',
    semester: 3,
    phone: '081234567890',
    personal_email: 'ayu@example.com',
    student_email: 'ayu@students.unimus.ac.id',
    instagram_username: 'ayu.lestari',
    primary_division_id: 'div-1',
    secondary_division_id: null,
    portfolio_type: 'none',
    portfolio_url: null,
    cv_original_name: 'cv-ayu.pdf',
    portfolio_original_name: null,
    instagram_follow_original_name: 'follow.jpg',
    twibbon_url: 'https://example.com/twibbon',
}

function mountTrackEdit(): VueWrapper {
    return mount(TrackEdit, {
        props: {
            application: demoApplication,
            divisions: [{ id: 'div-1', name: 'Divisi A' }],
            updateUrl: '/recruitment/track',
            dashboardUrl: '/recruitment/track/dashboard',
        },
        global: {
            stubs: {
                Card: true,
                CardContent: true,
                CardHeader: true,
                CardTitle: true,
                SearchableSelect: true,
                Separator: true,
            },
        },
    }) as unknown as VueWrapper
}

function editSubmitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Simpan perubahan') || b.text().includes('Menyimpan...'))
    if (!found) throw new Error('tombol simpan Track/Edit tidak ditemukan')
    return found as DOMWrapper<HTMLButtonElement>
}

const demoTracking = {
    application: {
        registration_number: 'OPREC-2026-00001',
        full_name: 'Ayu Lestari',
        nim: 'A11.2023.12345',
        semester: 3,
        stage: 'screening',
        stage_label: 'Screening',
        result: 'pending',
        result_label: 'Menunggu',
        revision_required: false,
        primary_division: 'Divisi A',
        secondary_division: null,
        submitted_at: null,
    },
    period: { name: 'Gelombang 1' },
    next_action: {
        tone: 'info',
        title: 'Lengkapi data',
        description: 'Perbaiki data sesuai instruksi tim.',
        action: null,
    },
    timeline: [],
    interview: null,
    queue: null,
    attendance: null,
    attendance_qr_base64: null,
    final: null,
    edit: {
        can_edit: false,
        can_request_correction: true,
        latest_correction: null,
    },
    feedback: {
        can_submit: false,
        submitted: false,
        submitted_at: null,
    },
}

function mountTrackShow(): VueWrapper {
    return mount(TrackShow, {
        props: {
            tracking: demoTracking,
            logoutUrl: '/recruitment/track/logout',
            editUrl: '/recruitment/track/edit',
            correctionUrl: '/recruitment/track/correction',
            feedbackStoreUrl: '/recruitment/track/feedback',
        },
        global: {
            stubs: {
                OpRecFeedbackForm: true,
                Dialog: true,
                DialogContent: true,
                DialogDescription: true,
                DialogFooter: true,
                DialogHeader: true,
                DialogTitle: true,
            },
        },
    }) as unknown as VueWrapper
}

function correctionSubmitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Kirim') || b.text().includes('Mengirim...'))
    if (!found) throw new Error('tombol kirim koreksi tidak ditemukan')
    return found as DOMWrapper<HTMLButtonElement>
}

function correctionFormEl(wrapper: VueWrapper): DOMWrapper<HTMLFormElement> {
    const found = wrapper
        .findAll('form')
        .find((f) =>
            f
                .findAll('button')
                .some((b) => b.text().includes('Kirim') || b.text().includes('Mengirim...')),
        )
    if (!found) throw new Error('formulir koreksi tidak ditemukan')
    return found as DOMWrapper<HTMLFormElement>
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

describe('Track/Edit submit (Task 6)', () => {
    it("submit → sibuk (spinner + 'Menyimpan...' ASCII + disabled + aria-busy) + PUT ke updateUrl", async () => {
        const wrapper = mountTrackEdit()
        try {
            expect(editSubmitButton(wrapper).attributes('disabled')).toBeUndefined()

            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(putMock).toHaveBeenCalledTimes(1)
            expect(putMock.mock.calls[0]?.[0]).toBe('/recruitment/track')

            const btn = editSubmitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menyimpan...')
            expect(btn.text()).not.toContain('…')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → toast sukses manual + tombol pulih', async () => {
        const wrapper = mountTrackEdit()
        try {
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastMutationOptions().onSuccess?.()
            finishProcessing()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Perubahan pendaftaran berhasil disimpan.',
            })

            const btn = editSubmitButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Simpan perubahan')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → handleInertiaFormErrors + tombol pulih', async () => {
        const wrapper = mountTrackEdit()
        try {
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastMutationOptions().onError?.({ phone: 'Nomor tidak valid.' })
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { phone: 'Nomor tidak valid.' },
                { title: 'Gagal menyimpan perubahan' },
            )
            expect(showFlashToast).not.toHaveBeenCalled()

            finishProcessing()
            await nextTick()
            expect(editSubmitButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it('submit ganda saat processing → hanya satu request', async () => {
        const wrapper = mountTrackEdit()
        try {
            await wrapper.find('form').trigger('submit')
            await nextTick()
            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(putMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})

describe('Track/Show koreksi (Task 6)', () => {
    it("kirim → sibuk (spinner + 'Mengirim...' + disabled + aria-busy) + POST ke correctionUrl", async () => {
        const wrapper = mountTrackShow()
        try {
            expect(correctionSubmitButton(wrapper).attributes('disabled')).toBeUndefined()

            await correctionFormEl(wrapper).trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
            expect(postMock.mock.calls[0]?.[0]).toBe('/recruitment/track/correction')

            const btn = correctionSubmitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Mengirim...')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → toast sukses manual + tombol pulih', async () => {
        const wrapper = mountTrackShow()
        try {
            await correctionFormEl(wrapper).trigger('submit')
            await nextTick()

            lastMutationOptions().onSuccess?.()
            finishProcessing()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Permintaan koreksi berhasil dikirim. Tim akan meninjau segera.',
            })

            const btn = correctionSubmitButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Kirim')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → handleInertiaFormErrors + tombol pulih', async () => {
        const wrapper = mountTrackShow()
        try {
            await correctionFormEl(wrapper).trigger('submit')
            await nextTick()

            lastMutationOptions().onError?.({ request_message: 'Pesan terlalu pendek.' })
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { request_message: 'Pesan terlalu pendek.' },
                { title: 'Gagal mengirim permintaan koreksi' },
            )
            expect(showFlashToast).not.toHaveBeenCalled()

            finishProcessing()
            await nextTick()
            expect(correctionSubmitButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it('kirim ganda saat processing → hanya satu request', async () => {
        const wrapper = mountTrackShow()
        try {
            await correctionFormEl(wrapper).trigger('submit')
            await nextTick()
            await correctionFormEl(wrapper).trigger('submit')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})
