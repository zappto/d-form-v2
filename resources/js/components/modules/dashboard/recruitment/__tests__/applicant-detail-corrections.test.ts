import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import ApplicantDetailContent, {
    type ApplicationDetail,
} from '../ApplicantDetailContent.vue'
import { showErrorToast, showFlashToast } from '@/lib/error-message'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 7: review koreksi (setujui/tolak) —
 * saat sibuk: CometSpinner 16px + swap teks + disabled + aria-busy="true" per-baris
 * (flag reviewingCorrectionId); sukses → showFlashToast manual
 * (RecruitmentCorrectionController::approve/reject memakai ->with('message') sesi
 * biasa yang tidak dibaca usePageFlashToast, preseden Task 4 open/close);
 * gagal → showErrorToast (pola handler tetangga postScreeningReject di file ini).
 * Swap: setujui → 'Menyimpan...' (default, preseden ConfirmationModal non-destruktif);
 * tolak → 'Menolak...' (aksi Tolak; sebelumnya salah 'Menghapus...' milik aksi hapus).
 */

const { formHolder, postMock } = vi.hoisted(() => ({
    formHolder: { state: null as Record<string, unknown> | null },
    postMock: vi.fn(),
}))

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')
    return {
        router: {
            post: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            reload: vi.fn(),
            visit: vi.fn(),
        },
        usePage: () => ({
            props: {
                auth: {
                    user: {
                        can_screen_recruitment_applications: false,
                        can_review_recruitment_corrections: true,
                        can_decide_recruitment_final: false,
                    },
                },
            },
        }),
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
    onError?: () => void
    onFinish?: () => void
}

let lastUrl: string | undefined
let lastOptions: InertiaMutationOptions | undefined

function lastPostCall(): { url: string; options: InertiaMutationOptions } {
    expect(postMock).toHaveBeenCalled()
    expect(lastUrl).toBeDefined()
    expect(lastOptions).toBeDefined()
    return { url: lastUrl as string, options: lastOptions as InertiaMutationOptions }
}

function demoApplication(): ApplicationDetail {
    return {
        id: 'ap-1',
        registration_number: 'OPREC-2026-00001',
        full_name: 'Ayu Lestari',
        nim: 'A11.2023.12345',
        semester: 3,
        phone: '081234567890',
        personal_email: 'ayu@example.com',
        student_email: 'ayu@students.unimus.ac.id',
        instagram_username: 'ayu.lestari',
        stage: 'screening',
        stage_label: 'Screening',
        result: 'pending',
        result_label: 'Menunggu',
        is_verified: false,
        revision_required: false,
        submitted_at: null,
        period: { id: 'per-1', name: 'Gelombang 1' },
        primary_division: { id: 'div-1', name: 'Divisi A', code: 'A' },
        secondary_division: null,
        document: null,
        screenings: [],
        activity_logs: [],
        correction_requests: [
            {
                id: 'cor-1',
                status: 'pending',
                status_label: 'Menunggu review',
                request_message: 'NIM saya salah ketik, mohon koreksi.',
                review_notes: null,
                reviewed_at: null,
                completed_at: null,
                reviewer: null,
            },
        ],
        evaluation: null,
        final_decision: null,
        can_screen: false,
        can_verify: false,
        can_decide_final: false,
    }
}

function mountContent(): VueWrapper {
    return mount(ApplicantDetailContent, {
        props: { application: demoApplication() },
        global: {
            stubs: {
                Card: true,
                CardContent: true,
                Checkbox: true,
                Label: true,
                SimpleSelect: true,
                Tabs: true,
                TabsContent: true,
                TabsList: true,
                TabsTrigger: true,
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

function correctionButton(
    wrapper: VueWrapper,
    idle: string,
    busy: string,
): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes(idle) || b.text().includes(busy))
    if (!found) throw new Error(`tombol koreksi (${idle}/${busy}) tidak ditemukan`)
    return found as DOMWrapper<HTMLButtonElement>
}

function approveButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    return correctionButton(wrapper, 'Setujui', 'Menyimpan...')
}

function rejectButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    return correctionButton(wrapper, 'Tolak', 'Menolak...')
}

beforeEach(() => {
    vi.clearAllMocks()
    lastUrl = undefined
    lastOptions = undefined
    postMock.mockReset()
    postMock.mockImplementation((...args: unknown[]) => {
        lastUrl = args[0] as string
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

describe('ApplicantDetailContent koreksi (Task 7)', () => {
    it("setujui → sibuk (spinner + 'Menyimpan...' + disabled + aria-busy) + POST approve", async () => {
        const wrapper = mountContent()
        try {
            expect(approveButton(wrapper).attributes('disabled')).toBeUndefined()

            await approveButton(wrapper).trigger('click')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
            expect(lastPostCall().url).toContain('cor-1')

            const btn = approveButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menyimpan...')
            expect(btn.text()).not.toContain('…')
        } finally {
            wrapper.unmount()
        }
    })

    it('setujui sukses → toast sukses manual + tombol pulih', async () => {
        const wrapper = mountContent()
        try {
            await approveButton(wrapper).trigger('click')
            await nextTick()

            lastPostCall().options.onSuccess?.()
            lastPostCall().options.onFinish?.()
            finishProcessing()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Permintaan koreksi disetujui.',
            })

            const btn = approveButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Setujui')
        } finally {
            wrapper.unmount()
        }
    })

    it('setujui gagal → showErrorToast + tombol pulih', async () => {
        const wrapper = mountContent()
        try {
            await approveButton(wrapper).trigger('click')
            await nextTick()

            lastPostCall().options.onError?.()
            lastPostCall().options.onFinish?.()
            await nextTick()

            expect(showErrorToast).toHaveBeenCalledWith('Gagal menyetujui permintaan koreksi.')
            expect(showFlashToast).not.toHaveBeenCalled()

            finishProcessing()
            await nextTick()
            expect(approveButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it("tolak → sibuk (spinner + 'Menolak...' + disabled + aria-busy) + POST reject", async () => {
        const wrapper = mountContent()
        try {
            await rejectButton(wrapper).trigger('click')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
            expect(lastPostCall().url).toContain('cor-1')

            const btn = rejectButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menolak...')
        } finally {
            wrapper.unmount()
        }
    })

    it('tolak sukses → toast sukses manual + tombol pulih', async () => {
        const wrapper = mountContent()
        try {
            await rejectButton(wrapper).trigger('click')
            await nextTick()

            lastPostCall().options.onSuccess?.()
            lastPostCall().options.onFinish?.()
            finishProcessing()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Permintaan koreksi ditolak.',
            })
            expect(rejectButton(wrapper).text()).toContain('Tolak')
        } finally {
            wrapper.unmount()
        }
    })

    it('tolak gagal → showErrorToast + tombol pulih', async () => {
        const wrapper = mountContent()
        try {
            await rejectButton(wrapper).trigger('click')
            await nextTick()

            lastPostCall().options.onError?.()
            lastPostCall().options.onFinish?.()
            await nextTick()

            expect(showErrorToast).toHaveBeenCalledWith('Gagal menolak permintaan koreksi.')
            expect(showFlashToast).not.toHaveBeenCalled()

            finishProcessing()
            await nextTick()
            expect(rejectButton(wrapper).attributes('disabled')).toBeUndefined()
        } finally {
            wrapper.unmount()
        }
    })

    it('klik ganda saat sibuk → hanya satu request', async () => {
        const wrapper = mountContent()
        try {
            await approveButton(wrapper).trigger('click')
            await nextTick()
            await approveButton(wrapper).trigger('click')
            await nextTick()

            expect(postMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})
