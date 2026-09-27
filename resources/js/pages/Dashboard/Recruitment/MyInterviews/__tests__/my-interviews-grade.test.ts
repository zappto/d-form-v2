import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import MyInterviewsShow from '../Show.vue';
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message';
import { toast } from 'vue-sonner';

/** Tipe detail diturunkan dari props komponen agar fixture tak menduplikasi bentuk. */
type DetailPayload = NonNullable<InstanceType<typeof MyInterviewsShow>['$props']['detail']>;

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 8 Part A: submit penilaian interview —
 * saat processing: CometSpinner 16px + swap 'Menyimpan...' + disabled + aria-busy="true".
 * Sukses → TANPA toast manual: RecruitmentMyInterviewController::evaluate memakai
 * ->with('message') yang disalurkan sebagai prop `flashMessage` dan tampil sebagai
 * alert role=status inline (termasuk sufiks dinamis "Berikutnya dipanggil: #NN" yang
 * tidak bisa direproduksi toast statis) — toast manual akan ganda dengan banner itu
 * (prinsip yang sama dengan Task 4 Events delete); test mengunci absence.
 * Gagal → handleInertiaFormErrors + form.errors tetap tampil di lapangan
 * (tidak tertelan toast). Guard ganda sudah ada (blockReason/processing), dikunci test.
 */

const { formHolder, postMock } = vi.hoisted(() => ({
    formHolder: { state: null as { processing: boolean; errors: Record<string, string> } | null },
    postMock: vi.fn<(url: string, options?: InertiaMutationOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        Head: { template: '<div style="display:none"></div>' },
        usePage: () => ({
            props: { auth: { user: { can_view_recruitment_queue: false } } },
            url: '/dashboard/recruitment/my-interviews/ap-1',
        }),
        useForm: <T extends object>(initial: T) => {
            const errors = reactive<Record<string, string>>({});
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: postMock,
                reset: vi.fn(),
                clearErrors: vi.fn(),
            });
            formHolder.state = state;
            return state;
        },
    };
});

vi.mock('@/layouts/DashboardLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/lib/error-message', () => ({
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

interface InertiaMutationOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

let lastOptions: InertiaMutationOptions | undefined;

function lastPostOptions(): InertiaMutationOptions {
    expect(postMock).toHaveBeenCalled();
    expect(lastOptions).toBeDefined();
    return lastOptions as InertiaMutationOptions;
}

function demoDetail(): DetailPayload {
    return {
        application: {
            id: 'ap-1',
            registration_number: 'OPREC-2026-00001',
            full_name: 'Ayu Lestari',
            nim: 'A11.2023.12345',
            semester: 3,
            primary_division: 'Divisi A',
            secondary_division: null,
        },
        documents: {
            has_cv: false,
            has_portfolio: false,
            portfolio_is_url: false,
            has_instagram_follow: false,
            cv_download_url: null,
            portfolio_download_url: null,
            portfolio_url: null,
            twibbon_url: null,
            cv_original_name: null,
            cv_size_bytes: null,
            cv_preview_url: null,
            portfolio_original_name: null,
            portfolio_size_bytes: null,
            portfolio_preview_url: null,
            instagram_follow_download_url: null,
            instagram_follow_preview_url: null,
            instagram_follow_original_name: null,
            instagram_follow_size_bytes: null,
        },
        interview: {
            scheduled_at: '2026-01-01T09:00:00+07:00',
            location: 'Gedung A',
            room: 'Ruang 1',
            status_label: 'Terjadwal',
            session: null,
        },
        queue: null,
        evaluation: {
            speaking_score: 7,
            technical_score: 6,
            attitude_score: 8,
            recommendation: 'recommended',
            recommendation_label: 'Direkomendasikan',
            notes: null,
            is_locked: false,
            can_edit: true,
        },
    };
}

function mountShow(flashMessage: string | null = null): VueWrapper<InstanceType<typeof MyInterviewsShow>> {
    return mount(MyInterviewsShow, {
        props: {
            detail: demoDetail(),
            evaluateUrl: '/dashboard/recruitment/my-interviews/ap-1/evaluate',
            recommendationOptions: [
                { value: 'recommended', label: 'Direkomendasikan' },
                { value: 'not_recommended', label: 'Tidak direkomendasikan' },
            ],
            flashMessage,
        },
        global: {
            stubs: {
                Badge: true,
                Card: true,
                CardContent: true,
                Label: true,
                Separator: true,
                Sheet: true,
                SheetContent: true,
                SessionQueueDrawer: true,
            },
        },
    });
}

function submitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Simpan penilaian') || b.text().includes('Menyimpan...'));
    if (!found) throw new Error('tombol simpan penilaian tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
}

function gradeForm(wrapper: VueWrapper): DOMWrapper<HTMLFormElement> {
    const found = wrapper
        .findAll('form')
        .find((f) =>
            f.findAll('button').some((b) => b.text().includes('Simpan penilaian') || b.text().includes('Menyimpan...'))
        );
    if (!found) throw new Error('formulir penilaian tidak ditemukan');
    return found as DOMWrapper<HTMLFormElement>;
}

beforeEach(() => {
    vi.clearAllMocks();
    lastOptions = undefined;
    postMock.mockReset();
    postMock.mockImplementation((url, options) => {
        lastOptions = options;
        const state = formHolder.state;
        if (state) state.processing = true;
    });
});

function finishProcessing(): void {
    const state = formHolder.state;
    if (state) state.processing = false;
}

/** Cerminkan perilaku Inertia asli: error-bag mengisi form.errors sebelum onError. */
function fireError(errors: Record<string, string>): void {
    const state = formHolder.state;
    const bag = state?.errors ?? {};
    for (const key of Object.keys(bag)) delete bag[key];
    Object.assign(bag, errors);
    lastPostOptions().onError?.(errors);
}

describe('MyInterviews/Show penilaian (Task 8)', () => {
    it("simpan → sibuk (spinner + 'Menyimpan...' ASCII + disabled + aria-busy) + POST ke evaluateUrl", async () => {
        const wrapper = mountShow();
        try {
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined();

            await gradeForm(wrapper).trigger('submit');
            await nextTick();

            expect(postMock).toHaveBeenCalledTimes(1);
            expect(postMock.mock.calls[0]?.[0]).toBe('/dashboard/recruitment/my-interviews/ap-1/evaluate');

            const btn = submitButton(wrapper);
            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
            expect(btn.find('[role="status"]').exists()).toBe(true);
            expect(btn.text()).toContain('Menyimpan...');
            expect(btn.text()).not.toContain('…');
        } finally {
            wrapper.unmount();
        }
    });

    it('sukses → TANPA toast manual (flashMessage prop) + tombol pulih', async () => {
        const wrapper = mountShow();
        try {
            await gradeForm(wrapper).trigger('submit');
            await nextTick();

            lastPostOptions().onSuccess?.();
            finishProcessing();
            await nextTick();

            // Sukses tampil via alert flashMessage (redirect membawa session message
            // sebagai prop, termasuk sufiks antrean dinamis) — toast manual ganda.
            expect(showFlashToast).not.toHaveBeenCalled();
            expect(toast.success).not.toHaveBeenCalled();

            const btn = submitButton(wrapper);
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('false');
            expect(btn.find('[role="status"]').exists()).toBe(false);
            expect(btn.text()).toContain('Simpan penilaian');
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → handleInertiaFormErrors + form.errors tetap tampil + tombol pulih', async () => {
        const wrapper = mountShow();
        try {
            await gradeForm(wrapper).trigger('submit');
            await nextTick();

            fireError({ recommendation: 'Rekomendasi wajib dipilih.' });
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { recommendation: 'Rekomendasi wajib dipilih.' },
                { title: 'Gagal menyimpan penilaian' }
            );
            expect(showFlashToast).not.toHaveBeenCalled();
            // Error lapangan tidak tertelan toast — tetap tampil inline.
            expect(wrapper.text()).toContain('Rekomendasi wajib dipilih.');

            finishProcessing();
            await nextTick();
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined();
        } finally {
            wrapper.unmount();
        }
    });

    it('submit ganda saat processing → hanya satu request', async () => {
        const wrapper = mountShow();
        try {
            await gradeForm(wrapper).trigger('submit');
            await nextTick();
            await gradeForm(wrapper).trigger('submit');
            await nextTick();

            expect(postMock).toHaveBeenCalledTimes(1);
        } finally {
            wrapper.unmount();
        }
    });

    it('prop flashMessage tampil sebagai alert status (vehikel sukses)', async () => {
        const wrapper = mountShow('Penilaian interview berhasil disimpan.');
        try {
            const alert = wrapper.find('[role="status"]');
            expect(alert.exists()).toBe(true);
            expect(alert.text()).toContain('Penilaian interview berhasil disimpan.');
        } finally {
            wrapper.unmount();
        }
    });
});
