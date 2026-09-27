import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import PeriodApplicantSection from '../PeriodApplicantSection.vue'
import ConfirmationModal from '@/components/core/ConfirmationModal.vue'
import { Dialog } from '@/components/ui/dialog'
import { handleInertiaFormErrors, showErrorToast, showFlashToast } from '@/lib/error-message'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 7: lulus/tolak applicant —
 * tombol per-baris: spinner saat processingId === id + disabled + aria-busy
 * (icon-only, tanpa swap teks); modal pass sudah wired Task 3 (:loading);
 * submit tolak: spinner + swap 'Menolak...' (aksi Tolak; sebelumnya salah pakai
 * 'Menghapus...' milik aksi hapus) + disabled + aria-busy.
 * Sukses → showFlashToast manual dengan copy verbatim server
 * (RecruitmentScreeningController::pass/reject memakai ->with('message') sesi biasa
 * yang tidak dibaca usePageFlashToast, preseden Task 4 open/close) — bukan copy
 * brief ('Aplikan diluluskan.'/'Aplikan ditolak.'), lihat Deviasi 1.
 * Gagal: pass (router.post, tanpa form) → showErrorToast (preseden Task 4 reschedule);
 * reject (useForm + field error di template) → handleInertiaFormErrors (preseden Task 5).
 */

const { routerPostMock, formPostMock, formHolder } = vi.hoisted(() => ({
    routerPostMock: vi.fn(),
    formPostMock: vi.fn(),
    formHolder: { state: null as Record<string, unknown> | null },
}))

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue')
    return {
        router: {
            post: routerPostMock,
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
                post: formPostMock,
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

interface RouterMutationOptions {
    preserveScroll?: boolean
    preserveState?: boolean
    onSuccess?: () => void
    onError?: (errors: Record<string, string>) => void
    onFinish?: () => void
}

let lastRouterOptions: RouterMutationOptions | undefined
let lastFormOptions: RouterMutationOptions | undefined

function lastRouterPostOptions(): RouterMutationOptions {
    expect(routerPostMock).toHaveBeenCalled()
    expect(lastRouterOptions).toBeDefined()
    return lastRouterOptions as RouterMutationOptions
}

function lastFormPostOptions(): RouterMutationOptions {
    expect(formPostMock).toHaveBeenCalled()
    expect(lastFormOptions).toBeDefined()
    return lastFormOptions as RouterMutationOptions
}

function demoRow(id: string, fullName: string): Record<string, unknown> {
    return {
        id,
        registration_number: `REG-${id}`,
        full_name: fullName,
        nim: `A11.2023.${id}`,
        semester: 3,
        stage: 'submitted',
        stage_label: 'Submitted',
        result: 'pending',
        result_label: 'Menunggu',
        revision_required: false,
        submitted_at: null,
        primary_division: { id: 'div-1', name: 'Divisi A' },
        secondary_division: null,
        period: { id: 'per-1', name: 'Gelombang 1' },
    }
}

function mountSection(): VueWrapper {
    return mount(PeriodApplicantSection, {
        props: {
            periodId: 'per-1',
            applications: [demoRow('ap-1', 'Budi Santoso'), demoRow('ap-2', 'Siti Aminah')],
            queueCounts: {},
            divisionOptions: [{ id: 'div-1', name: 'Divisi A', code: 'A' }],
            stageOptions: [{ value: 'submitted', label: 'Submitted' }],
            tab: 'applicants',
            canScreen: true,
        },
        global: {
            stubs: {
                ConfirmationModal: true,
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

function rowButton(wrapper: VueWrapper, ariaLabel: string): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.attributes('aria-label') === ariaLabel)
    if (!found) throw new Error(`tombol baris "${ariaLabel}" tidak ditemukan`)
    return found as DOMWrapper<HTMLButtonElement>
}

function passModal(wrapper: VueWrapper): VueWrapper {
    return wrapper.findComponent(ConfirmationModal) as unknown as VueWrapper
}

function rejectDialog(wrapper: VueWrapper): VueWrapper {
    return wrapper.findComponent(Dialog) as unknown as VueWrapper
}

function rejectSubmitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Tolak applicant') || b.text().includes('Menolak...'))
    if (!found) throw new Error('tombol submit tolak tidak ditemukan')
    return found as DOMWrapper<HTMLButtonElement>
}

async function openRejectWithReason(wrapper: VueWrapper): Promise<void> {
    await rowButton(wrapper, 'Tolak Budi Santoso').trigger('click')
    await nextTick()
    await wrapper.find('#quick-reject-reason').setValue('incomplete_data')
    await nextTick()
}

beforeEach(() => {
    vi.clearAllMocks()
    lastRouterOptions = undefined
    lastFormOptions = undefined
    routerPostMock.mockReset()
    formPostMock.mockReset()
    routerPostMock.mockImplementation((...args: unknown[]) => {
        lastRouterOptions = args[2] as RouterMutationOptions | undefined
        return undefined
    })
    formPostMock.mockImplementation((...args: unknown[]) => {
        lastFormOptions = args[1] as RouterMutationOptions | undefined
        const state = formHolder.state
        if (state) state.processing = true
        return undefined
    })
})

describe('PeriodApplicantSection pass (Task 7)', () => {
    it('klik lolos → modal konfirmasi terbuka', async () => {
        const wrapper = mountSection()
        try {
            await rowButton(wrapper, 'Loloskan Budi Santoso').trigger('click')
            await nextTick()

            expect(passModal(wrapper).props('open')).toBe(true)
            expect(routerPostMock).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('konfirmasi lolos → sibuk (spinner baris + modal loading) + POST pass', async () => {
        const wrapper = mountSection()
        try {
            await rowButton(wrapper, 'Loloskan Budi Santoso').trigger('click')
            await nextTick()
            await (passModal(wrapper).vm as unknown as { $emit: (e: string) => void }).$emit(
                'confirm',
            )
            await nextTick()

            expect(routerPostMock).toHaveBeenCalledTimes(1)
            const url = routerPostMock.mock.calls[0]?.[0] as string
            expect(url).toContain('ap-1')

            expect(passModal(wrapper).props('loading')).toBe(true)
            const btn = rowButton(wrapper, 'Loloskan Budi Santoso')
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })

    it('lolos sukses → toast verbatim server + baris pulih + modal tutup', async () => {
        const wrapper = mountSection()
        try {
            await rowButton(wrapper, 'Loloskan Budi Santoso').trigger('click')
            await nextTick()
            await (passModal(wrapper).vm as unknown as { $emit: (e: string) => void }).$emit(
                'confirm',
            )
            await nextTick()

            lastRouterPostOptions().onSuccess?.()
            lastRouterPostOptions().onFinish?.()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Applicant lolos screening.',
            })

            const btn = rowButton(wrapper, 'Loloskan Budi Santoso')
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(passModal(wrapper).props('open')).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })

    it('lolos gagal → showErrorToast + baris pulih', async () => {
        const wrapper = mountSection()
        try {
            await rowButton(wrapper, 'Loloskan Budi Santoso').trigger('click')
            await nextTick()
            await (passModal(wrapper).vm as unknown as { $emit: (e: string) => void }).$emit(
                'confirm',
            )
            await nextTick()

            lastRouterPostOptions().onError?.({})
            lastRouterPostOptions().onFinish?.()
            await nextTick()

            expect(showErrorToast).toHaveBeenCalledWith('Gagal meloloskan applicant.')
            expect(showFlashToast).not.toHaveBeenCalled()

            const btn = rowButton(wrapper, 'Loloskan Budi Santoso')
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })
})

describe('PeriodApplicantSection reject (Task 7)', () => {
    it('klik tolak → dialog tolak terbuka', async () => {
        const wrapper = mountSection()
        try {
            await rowButton(wrapper, 'Tolak Budi Santoso').trigger('click')
            await nextTick()

            expect(rejectDialog(wrapper).props('open')).toBe(true)
            expect(formPostMock).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('submit tanpa alasan → error lokal + tanpa request', async () => {
        const wrapper = mountSection()
        try {
            await rowButton(wrapper, 'Tolak Budi Santoso').trigger('click')
            await nextTick()
            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(formPostMock).not.toHaveBeenCalled()
            expect(wrapper.text()).toContain('Alasan penolakan wajib diisi.')
        } finally {
            wrapper.unmount()
        }
    })

    it("submit tolak → sibuk (spinner + 'Menolak...' + disabled + aria-busy) + POST reject", async () => {
        const wrapper = mountSection()
        try {
            await openRejectWithReason(wrapper)
            await wrapper.find('form').trigger('submit')
            await nextTick()

            expect(formPostMock).toHaveBeenCalledTimes(1)
            const url = formPostMock.mock.calls[0]?.[0] as string
            expect(url).toContain('ap-1')

            const btn = rejectSubmitButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('true')
            expect(btn.find('[role="status"]').exists()).toBe(true)
            expect(btn.text()).toContain('Menolak...')
            expect(btn.text()).not.toContain('…')
        } finally {
            wrapper.unmount()
        }
    })

    it('tolak sukses → toast verbatim server + dialog tutup + tombol pulih', async () => {
        const wrapper = mountSection()
        try {
            await openRejectWithReason(wrapper)
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastFormPostOptions().onSuccess?.()
            const state = formHolder.state
            if (state) state.processing = false
            lastFormPostOptions().onFinish?.()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Applicant ditolak pada tahap screening.',
            })
            expect(rejectDialog(wrapper).props('open')).toBe(false)

            const btn = rejectSubmitButton(wrapper)
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })

    it('tolak gagal → handleInertiaFormErrors + dialog tetap buka', async () => {
        const wrapper = mountSection()
        try {
            await openRejectWithReason(wrapper)
            await wrapper.find('form').trigger('submit')
            await nextTick()

            lastFormPostOptions().onError?.({ reason: 'Alasan tidak valid.' })
            const state = formHolder.state
            if (state) state.processing = false
            lastFormPostOptions().onFinish?.()
            await nextTick()

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { reason: 'Alasan tidak valid.' },
                { title: 'Gagal menolak applicant.' },
            )
            expect(showFlashToast).not.toHaveBeenCalled()
            expect(rejectDialog(wrapper).props('open')).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })
})
