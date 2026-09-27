import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import InterviewerCreateSheet from '../InterviewerCreateSheet.vue';
const { handleInertiaFormErrors } = vi.hoisted(() => ({
    handleInertiaFormErrors: vi.fn(),
}));
import { toast } from 'vue-sonner';
import { routes } from '@/lib/routes';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 5: submit sheet interviewer (useForm) —
 * saat processing: CometSpinner 16px + 'Menyimpan...' + disabled + aria-busy;
 * sukses → emit created + sheet tutup TANPA toast manual ganda
 * (sukses sudah ditampilkan global via flash `toast` server → usePageFlashToast);
 * gagal → handleInertiaFormErrors + sheet tetap buka; submit ganda → satu request.
 */

/** Bentuk form interviewer (selaras useForm di komponen) + flag processing milik Inertia. */
interface IInterviewerFormState {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    recruitment_division_id: string;
    processing: boolean;
}

const { formHolder, postMock } = vi.hoisted(() => ({
    formHolder: { state: null as IInterviewerFormState | null },
    postMock: vi.fn<(url: string, options?: InertiaMutationOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        useForm: (initial: IInterviewerFormState) => {
            const state = reactive({
                ...initial,
                errors: {},
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

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ handleInertiaFormErrors }),
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

function mountSheet(): VueWrapper {
    return mount(InterviewerCreateSheet, {
        props: {
            open: true,
            divisions: [{ id: 'div-1', name: 'Divisi A', code: 'DV' }],
            initialDivisionId: 'div-1',
        },
        global: {
            stubs: {
                Sheet: true,
                SheetContent: true,
                SheetHeader: true,
                SheetTitle: true,
                SheetDescription: true,
                SearchableSelect: true,
            },
        },
    });
}

async function fillValid(): Promise<void> {
    const state = formHolder.state;
    if (!state) throw new Error('form state belum dibuat');
    Object.assign(state, {
        name: 'Budi Santoso',
        email: 'budi@contoh.id',
        password: 'rahasia123',
        password_confirmation: 'rahasia123',
        recruitment_division_id: 'div-1',
    });
    await nextTick();
}

function submitButton(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    const found = wrapper
        .findAll('button')
        .find((b) => b.text().includes('Simpan interviewer') || b.text().includes('Menyimpan...'));
    if (!found) throw new Error('tombol submit sheet tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
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

describe('InterviewerCreateSheet submit (Task 5)', () => {
    it('submit valid → sibuk (spinner + Menyimpan... + disabled + aria-busy) + POST', async () => {
        const wrapper = mountSheet();
        try {
            await fillValid();
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined();

            await wrapper.find('form').trigger('submit');
            await nextTick();

            expect(postMock).toHaveBeenCalledTimes(1);
            expect(postMock.mock.calls[0]?.[0]).toBe(routes.admin.recruitment.interviewers.store);

            const btn = submitButton(wrapper);
            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
            expect(btn.find('[role="status"]').exists()).toBe(true);
            expect(btn.text()).toContain('Menyimpan...');
        } finally {
            wrapper.unmount();
        }
    });

    it('sukses → emit created + sheet tutup, tanpa toast manual ganda', async () => {
        const wrapper = mountSheet();
        try {
            await fillValid();
            await wrapper.find('form').trigger('submit');
            await nextTick();

            lastPostOptions().onSuccess?.();
            // Inertia menyelesaikan request → processing pulih.
            const state = formHolder.state;
            if (state) state.processing = false;
            await nextTick();

            expect(wrapper.emitted('created')).toEqual([['budi@contoh.id']]);
            expect(wrapper.emitted('close')).toBeTruthy();
            expect(toast.success).not.toHaveBeenCalled();
            expect(handleInertiaFormErrors).not.toHaveBeenCalled();

            const btn = submitButton(wrapper);
            expect(btn.text()).toContain('Simpan interviewer');
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → handleInertiaFormErrors + sheet tetap buka', async () => {
        const wrapper = mountSheet();
        try {
            await fillValid();
            await wrapper.find('form').trigger('submit');
            await nextTick();

            lastPostOptions().onError?.({ email: 'Email sudah dipakai.' });
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { email: 'Email sudah dipakai.' },
                { title: 'Gagal menambah interviewer' }
            );
            expect(wrapper.emitted('close')).toBeFalsy();
            expect(wrapper.emitted('created')).toBeFalsy();

            const state = formHolder.state;
            if (state) state.processing = false;
            await nextTick();
            expect(submitButton(wrapper).attributes('disabled')).toBeUndefined();
            expect(wrapper.emitted('close')).toBeFalsy();
        } finally {
            wrapper.unmount();
        }
    });

    it('submit ganda saat processing → hanya satu request', async () => {
        const wrapper = mountSheet();
        try {
            await fillValid();
            await wrapper.find('form').trigger('submit');
            await nextTick();
            await wrapper.find('form').trigger('submit');
            await nextTick();

            expect(postMock).toHaveBeenCalledTimes(1);
        } finally {
            wrapper.unmount();
        }
    });
});
