import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils'
import InterviewSessionShow from '../Show.vue'
import { showErrorToast, showFlashToast } from '@/lib/error-message'

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true

/**
 * Spec §3.2/§3.4, Task 4: tombol reschedule (Pindah) per interview —
 * saat sibuk: CometSpinner 16px inline + teks 'Menyimpan...' + disabled + aria-busy="true";
 * sukses → showFlashToast + pilihan sesi direset; gagal → showErrorToast + tombol pulih.
 */

const { routerPostMock } = vi.hoisted(() => ({ routerPostMock: vi.fn() }))

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<div style="display:none"></div>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: { post: routerPostMock, get: vi.fn(), delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props: { auth: { user: {} } } }),
    useForm: () => ({
        application_ids: [],
        errors: {},
        processing: false,
        post: vi.fn(),
        reset: vi.fn(),
    }),
}))

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }))

vi.mock('@/lib/error-message', () => ({
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}))

interface RouterMutationOptions {
    preserveScroll?: boolean
    onSuccess?: () => void
    onError?: (errors: Record<string, string>) => void
    onFinish?: () => void
}

function lastPostOptions(): RouterMutationOptions {
    const calls = routerPostMock.mock.calls as unknown[][]
    expect(routerPostMock).toHaveBeenCalled()
    const options = calls[calls.length - 1]?.[2] as RouterMutationOptions | undefined
    expect(options).toBeDefined()
    return options as RouterMutationOptions
}

function mountShow(): VueWrapper {
    return mount(InterviewSessionShow, {
        props: {
            session: {
                id: 'ses-1',
                session_date: '2026-10-01',
                starts_at: '09:00',
                ends_at: '12:00',
                location: 'Gedung A',
                room: 'Ruang 1',
                notes: null,
                is_active: true,
                interviews_count: 1,
                period: null,
                division: null,
                interviews: [
                    {
                        id: 'iv-1',
                        scheduled_at: null,
                        location: 'Gedung A',
                        room: 'Ruang 1',
                        status: 'scheduled',
                        status_label: 'Terjadwal',
                        application: {
                            id: 'ap-1',
                            full_name: 'Budi Santoso',
                            registration_number: 'REG-001',
                        },
                        interviewer: null,
                    },
                ],
            },
            eligibleApplicants: [],
            interviewerOptions: [],
            otherSessions: [
                {
                    id: 'ses-2',
                    session_date: '2026-10-02',
                    starts_at: '13:00',
                    division: { name: 'Divisi A' },
                },
            ],
        },
        global: {
            stubs: {
                InterviewerCreateSheet: true,
                SearchableSelect: true,
                Label: true,
            },
        },
    }) as unknown as VueWrapper
}

function rescheduleButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Pindah') || b.text().includes('Menyimpan...'))
    if (!found) throw new Error('tombol reschedule (Pindah) tidak ditemukan')
    return found as DOMWrapper<HTMLButtonElement>
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('InterviewSessions/Show reschedule (Task 4)', () => {
    it('tanpa pilihan sesi → tombol Pindah disabled', () => {
        const wrapper = mountShow()
        try {
            expect(rescheduleButton(wrapper).attributes('disabled')).not.toBeUndefined()
            expect(routerPostMock).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('pilih sesi + klik → sibuk (spinner + Menyimpan... + disabled + aria-busy) + POST', async () => {
        const wrapper = mountShow()
        try {
            await wrapper.find('select').setValue('ses-2')
            await rescheduleButton(wrapper).trigger('click')
            await nextTick()

            expect(routerPostMock).toHaveBeenCalledTimes(1)
            expect(routerPostMock.mock.calls[0]?.[0]).toBe('/admin/recruitment/interviews/iv-1/reschedule')
            expect(routerPostMock.mock.calls[0]?.[1]).toEqual({ recruitment_interview_session_id: 'ses-2' })

            const busy = rescheduleButton(wrapper)
            expect(busy.attributes('disabled')).not.toBeUndefined()
            expect(busy.attributes('aria-busy')).toBe('true')
            expect(busy.find('[role="status"]').exists()).toBe(true)
            expect(busy.text()).toContain('Menyimpan...')
        } finally {
            wrapper.unmount()
        }
    })

    it('sukses → toast sukses + pilihan sesi direset + tombol pulih', async () => {
        const wrapper = mountShow()
        try {
            await wrapper.find('select').setValue('ses-2')
            await rescheduleButton(wrapper).trigger('click')
            await nextTick()
            const options = lastPostOptions()
            options.onSuccess?.()
            options.onFinish?.()
            await nextTick()

            expect(showFlashToast).toHaveBeenCalledWith({
                type: 'success',
                message: 'Jadwal interview diperbarui.',
            })
            const btn = rescheduleButton(wrapper)
            expect(btn.attributes('disabled')).not.toBeUndefined()
            expect(btn.attributes('aria-busy')).toBe('false')
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Pindah')
        } finally {
            wrapper.unmount()
        }
    })

    it('gagal → toast error + tombol pulih (pilihan sesi tetap)', async () => {
        const wrapper = mountShow()
        try {
            await wrapper.find('select').setValue('ses-2')
            await rescheduleButton(wrapper).trigger('click')
            await nextTick()
            const options = lastPostOptions()
            options.onError?.({})
            options.onFinish?.()
            await nextTick()

            expect(showErrorToast).toHaveBeenCalledWith('Gagal memindahkan jadwal interview. Coba lagi.')
            const btn = rescheduleButton(wrapper)
            expect(btn.attributes('disabled')).toBeUndefined()
            expect(btn.find('[role="status"]').exists()).toBe(false)
            expect(btn.text()).toContain('Pindah')
        } finally {
            wrapper.unmount()
        }
    })

    it('klik ganda saat sibuk → hanya satu request', async () => {
        const wrapper = mountShow()
        try {
            await wrapper.find('select').setValue('ses-2')
            await rescheduleButton(wrapper).trigger('click')
            await nextTick()
            await rescheduleButton(wrapper).trigger('click')
            await nextTick()
            expect(routerPostMock).toHaveBeenCalledTimes(1)
        } finally {
            wrapper.unmount()
        }
    })
})
