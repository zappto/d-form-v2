import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { config, mount, type VueWrapper, type DOMWrapper } from '@vue/test-utils';
import TeamInvitation from '../TeamInvitation.vue';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message';
import type { TFormFillAnswerMap, TFormFillAnswerValue } from '@/types/form';
import { toast } from 'vue-sonner';

/** Stub component (`: true`) ikut me-render slot bawaannya. */
config.global.renderStubDefaultSlot = true;

/**
 * Spec §3.2/§3.4, Task 7: konfirmasi/tolak undangan tim —
 * trigger accept + submit decline: CometSpinner 16px + swap 'Mengirim...'
 * (aksi bertipe kirim) + disabled + aria-busy; modal accept sudah wired Task 3
 * (:loading, tidak diduplikasi); guard anti double-submit di kedua submit.
 * Sukses → flash path: TeamInvitationController::update (accept 3 jalur + reject)
 * memakai Inertia::flash('toast', …) yang tampil global via usePageFlashToast —
 * toast manual akan ganda → tidak ditambah (pola Task 4 Events / Task 5 sheets /
 * Task 6 Create), test mengunci absence. Gagal → handleInertiaFormErrors
 * (payload onError Inertia = error-bag datar, preseden Task 4 Deviasi 2).
 */

interface IMutationOptions {
    forceFormData?: boolean;
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

interface IPostedCall {
    tag: 'confirm' | 'decline';
    url: string;
    options: IMutationOptions | undefined;
}

/** Nilai state form mock: bag jawaban + flag/kontrol useForm yang ikut di-spread. */
type TMockFormStateValue =
    | TFormFillAnswerValue
    | boolean
    | Record<string, string>
    | (() => void)
    | ((url: string, options?: IMutationOptions) => void);

/** State form mock dengan index signature agar test dapat membaca/menulis bag jawaban. */
interface IMockFormState {
    processing: boolean;
    [key: string]: TMockFormStateValue;
}

const { postedCalls, formStates, createdCounter } = vi.hoisted(() => ({
    postedCalls: [] as IPostedCall[],
    formStates: [] as Array<{ tag: 'confirm' | 'decline'; state: IMockFormState }>,
    createdCounter: { count: 0 },
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        Head: { template: '<div style="display:none"></div>' },
        useForm: <T extends object>(initial: T) => {
            createdCounter.count += 1;
            // Urutan setup: confirmForm dulu, declineForm kemudian.
            const tag = createdCounter.count % 2 === 1 ? 'confirm' : 'decline';
            const errors = reactive<Record<string, string>>({});
            const state = reactive({
                ...initial,
                errors,
                processing: false,
                post: (url: string, options?: IMutationOptions) => {
                    state.processing = true;
                    postedCalls.push({ tag, url, options });
                    return undefined;
                },
                transform: () => ({ post: state.post }),
                reset: vi.fn(() => {
                    Object.assign(state, initial);
                }),
                clearErrors: vi.fn(),
            });
            formStates.push({ tag, state });
            return state;
        },
    };
});

vi.mock('@/layouts/FormFillLayout.vue', () => ({ default: { template: '<slot />' } }));

vi.mock('@/lib/error-message', () => ({
    buildFieldLabelMap: () => ({}),
    getFieldError: () => undefined,
    handleInertiaFormErrors: vi.fn(),
    humanizeErrorMessage: (message: string): string => message,
    showErrorToast: vi.fn(),
    showFlashToast: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function mountInvitationWithFields(
    fields: IFormField[],
    answers: TFormFillAnswerMap
): VueWrapper<InstanceType<typeof TeamInvitation>> {
    window.localStorage.removeItem('dform:invite:fo-1');
    return mount(TeamInvitation, {
        props: {
            event: { id: 'ev-1', slug: 'acara', title: 'Acara' },
            form: { id: 'fo-1', title: 'Formulir' },
            fields,
            answers,
            leader: { name: 'Ketua', email: 'ketua@example.com' },
            alreadyConfirmed: false,
            confirmUrl: '/invitation/token-abc',
        },
        global: {
            stubs: {
                AlertDialog: true,
                AlertDialogAction: true,
                AlertDialogCancel: true,
                AlertDialogContent: true,
                AlertDialogDescription: true,
                AlertDialogFooter: true,
                AlertDialogHeader: true,
                AlertDialogTitle: true,
                Dialog: true,
                DialogContent: true,
                DialogDescription: true,
                DialogFooter: true,
                DialogHeader: true,
                DialogTitle: true,
            },
        },
    });
}

function mountInvitation(): VueWrapper<InstanceType<typeof TeamInvitation>> {
    return mountInvitationWithFields([], {});
}

/** Field undangan editable (`is_append`) dengan default minimal; override sesuai skenario test. */
function invitationField(overrides: Partial<IFormField>): IFormField {
    return {
        id: 'field-1',
        type: 'input',
        label: 'Field',
        name: 'field',
        order: 1,
        metadata: {},
        is_append: true,
        ...overrides,
    };
}

/** Bag jawaban confirmForm dari mock useForm (form pertama yang dibuat komponen undangan). */
function confirmFormState(): IMockFormState {
    const entry = formStates.find((s) => s.tag === 'confirm');
    if (!entry) throw new Error('confirmForm belum dibuat');
    return entry.state;
}

function triggerButton(wrapper: VueWrapper, idle: string, busy: string): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.text().includes(idle) || b.text().includes(busy));
    if (!found) throw new Error(`tombol (${idle}/${busy}) tidak ditemukan`);
    return found as DOMWrapper<HTMLButtonElement>;
}

function acceptTrigger(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    return triggerButton(wrapper, 'Accept invitation', 'Mengirim...');
}

function declineSubmit(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    return triggerButton(wrapper, 'Decline invitation', 'Mengirim...');
}

function acceptModal(wrapper: VueWrapper): VueWrapper<InstanceType<typeof ConfirmationModal>> {
    return wrapper.findComponent(ConfirmationModal);
}

function declineDialog(wrapper: VueWrapper): VueWrapper<InstanceType<typeof Dialog>> {
    return wrapper.findComponent(Dialog);
}

function confirmCalls(): IPostedCall[] {
    return postedCalls.filter((c) => c.tag === 'confirm');
}

function declineCalls(): IPostedCall[] {
    return postedCalls.filter((c) => c.tag === 'decline');
}

function finishProcessing(tag: 'confirm' | 'decline'): void {
    const entry = formStates.find((s) => s.tag === tag);
    if (entry) entry.state.processing = false;
}

async function openAcceptModal(wrapper: VueWrapper): Promise<void> {
    await acceptTrigger(wrapper).trigger('click');
    await nextTick();
}

async function confirmAccept(wrapper: VueWrapper): Promise<void> {
    await openAcceptModal(wrapper);
    // ConfirmationModal milik Task 3 (tombolnya sudah diuji di
    // ConfirmationModal.test.ts) — di sini cukup emit 'confirm'.
    acceptModal(wrapper).vm.$emit('confirm');
    await nextTick();
}

async function openDeclineDialog(wrapper: VueWrapper): Promise<void> {
    const trigger = wrapper.findAll('button').find((b) => b.text().trim() === 'Decline');
    if (!trigger) throw new Error('tombol Decline tidak ditemukan');
    await trigger.trigger('click');
    await nextTick();
}

beforeEach(() => {
    vi.clearAllMocks();
    postedCalls.length = 0;
    formStates.length = 0;
    createdCounter.count = 0;
});

describe('TeamInvitation accept (Task 7)', () => {
    it('klik trigger → modal konfirmasi terbuka (tanpa request)', async () => {
        const wrapper = mountInvitation();
        try {
            await openAcceptModal(wrapper);

            expect(acceptModal(wrapper).props('open')).toBe(true);
            expect(postedCalls).toHaveLength(0);
        } finally {
            wrapper.unmount();
        }
    });

    it("konfirmasi → sibuk (spinner + 'Mengirim...' + disabled + aria-busy) + POST confirmUrl", async () => {
        const wrapper = mountInvitation();
        try {
            await confirmAccept(wrapper);

            expect(confirmCalls()).toHaveLength(1);
            expect(confirmCalls()[0]?.url).toBe('/invitation/token-abc');
            expect(acceptModal(wrapper).props('loading')).toBe(true);

            const btn = acceptTrigger(wrapper);
            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
            expect(btn.find('[role="status"]').exists()).toBe(true);
            expect(btn.text()).toContain('Mengirim...');
            expect(btn.text()).not.toContain('…');
        } finally {
            wrapper.unmount();
        }
    });

    it('sukses → flash path (tanpa toast manual) + draft lokal dibersihkan', async () => {
        const wrapper = mountInvitation();
        try {
            await confirmAccept(wrapper);

            // Controller memakai Inertia::flash('toast') → toast global;
            // onSuccess hanya membersihkan draft lokal, tanpa toast manual.
            expect(confirmCalls()[0]?.options?.onSuccess).toBeDefined();
            expect(confirmCalls()[0]?.options?.onError).toBeDefined();

            window.localStorage.setItem('dform:invite:fo-1', '{"values":{"catatan":"draft"}}');
            confirmCalls()[0]?.options?.onSuccess?.();
            expect(window.localStorage.getItem('dform:invite:fo-1')).toBeNull();

            expect(showFlashToast).not.toHaveBeenCalled();
            expect(toast.success).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('gagal → handleInertiaFormErrors + tombol pulih', async () => {
        const wrapper = mountInvitation();
        try {
            await confirmAccept(wrapper);

            confirmCalls()[0]?.options?.onError?.({ answers: 'Data tidak valid.' });
            finishProcessing('confirm');
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { answers: 'Data tidak valid.' },
                expect.objectContaining({ title: 'Gagal mengonfirmasi undangan' })
            );
            expect(showFlashToast).not.toHaveBeenCalled();

            const btn = acceptTrigger(wrapper);
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('false');
            expect(btn.find('[role="status"]').exists()).toBe(false);
            expect(btn.text()).toContain('Accept invitation');
        } finally {
            wrapper.unmount();
        }
    });

    it('konfirmasi ganda saat processing → hanya satu request', async () => {
        const wrapper = mountInvitation();
        try {
            await confirmAccept(wrapper);
            await confirmAccept(wrapper);

            expect(confirmCalls()).toHaveLength(1);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('TeamInvitation decline (Task 7)', () => {
    it("submit tolak → sibuk (spinner + 'Mengirim...' + disabled + aria-busy) + POST confirmUrl", async () => {
        const wrapper = mountInvitation();
        try {
            await openDeclineDialog(wrapper);
            expect(declineDialog(wrapper).props('open')).toBe(true);

            await declineSubmit(wrapper).trigger('click');
            await nextTick();

            expect(declineCalls()).toHaveLength(1);
            expect(declineCalls()[0]?.url).toBe('/invitation/token-abc');

            const btn = declineSubmit(wrapper);
            expect(btn.attributes('disabled')).not.toBeUndefined();
            expect(btn.attributes('aria-busy')).toBe('true');
            expect(btn.find('[role="status"]').exists()).toBe(true);
            expect(btn.text()).toContain('Mengirim...');
        } finally {
            wrapper.unmount();
        }
    });

    it('tolak gagal → handleInertiaFormErrors + dialog tetap buka + tombol pulih', async () => {
        const wrapper = mountInvitation();
        try {
            await openDeclineDialog(wrapper);
            await declineSubmit(wrapper).trigger('click');
            await nextTick();

            declineCalls()[0]?.options?.onError?.({ decline_reason: 'Alasan wajib diisi.' });
            finishProcessing('decline');
            await nextTick();

            expect(handleInertiaFormErrors).toHaveBeenCalledWith(
                { decline_reason: 'Alasan wajib diisi.' },
                expect.objectContaining({ title: 'Gagal menolak undangan' })
            );
            expect(declineDialog(wrapper).props('open')).toBe(true);

            const btn = declineSubmit(wrapper);
            expect(btn.attributes('disabled')).toBeUndefined();
            expect(btn.text()).toContain('Decline invitation');
        } finally {
            wrapper.unmount();
        }
    });

    it('submit tolak ganda saat processing → hanya satu request', async () => {
        const wrapper = mountInvitation();
        try {
            await openDeclineDialog(wrapper);
            await declineSubmit(wrapper).trigger('click');
            await nextTick();
            await declineSubmit(wrapper).trigger('click');
            await nextTick();

            expect(declineCalls()).toHaveLength(1);
        } finally {
            wrapper.unmount();
        }
    });
});

/**
 * DFORM-46: test penjaga binding jawaban dinamis (text/textarea/radio/file)
 * pasca commit f3c4b81 yang menghapus cast `as`. `fields` diisi agar cabang
 * template memanggil textAnswer/setTextAnswer/onFileAnswerChange (sebelumnya
 * `fields: []` membuat cabang ini tak pernah dieksekusi).
 */
describe('TeamInvitation dynamic field answers (DFORM-46)', () => {
    it('text: nilai string dari bag jawaban tampil di input', async () => {
        const wrapper = mountInvitationWithFields(
            [invitationField({ name: 'catatan', label: 'Catatan', type: 'input' })],
            { catatan: 'Draft awal' }
        );
        try {
            expect(wrapper.find<HTMLInputElement>('input').element.value).toBe('Draft awal');
        } finally {
            wrapper.unmount();
        }
    });

    it('text: update menulis string ke bag (angka non-string dikonversi)', async () => {
        const wrapper = mountInvitationWithFields(
            [invitationField({ name: 'catatan', label: 'Catatan', type: 'input' })],
            {}
        );
        try {
            wrapper.findComponent(Input).vm.$emit('update:modelValue', 42);
            await nextTick();

            expect(confirmFormState()['catatan']).toBe('42');
            expect(wrapper.find<HTMLInputElement>('input').element.value).toBe('42');
        } finally {
            wrapper.unmount();
        }
    });

    it('textarea: nilai dari bag tampil + update menulis string ke bag', async () => {
        const wrapper = mountInvitationWithFields(
            [invitationField({ name: 'catatan', label: 'Catatan', type: 'textarea' })],
            { catatan: 'Draft awal' }
        );
        try {
            const textarea = wrapper.find<HTMLTextAreaElement>('textarea:not(#decline_reason)');
            expect(textarea.element.value).toBe('Draft awal');

            await textarea.setValue('Draft baru');

            expect(confirmFormState()['catatan']).toBe('Draft baru');
        } finally {
            wrapper.unmount();
        }
    });

    it('radio: baris dengan label cocok checked, lainnya tidak', async () => {
        const wrapper = mountInvitationWithFields(
            [
                invitationField({
                    name: 'pilihan',
                    label: 'Pilihan',
                    type: 'radio',
                    metadata: { optionChoices: ['Ya', 'Tidak'] },
                }),
            ],
            { pilihan: 'Ya' }
        );
        try {
            const radios = wrapper.findAll<HTMLInputElement>('input[type="radio"]');
            expect(radios).toHaveLength(2);
            expect(radios[0].element.checked).toBe(true);
            expect(radios[1].element.checked).toBe(false);

            await radios[1].setValue();

            expect(confirmFormState()['pilihan']).toBe('Tidak');
            expect(radios[0].element.checked).toBe(false);
            expect(radios[1].element.checked).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('file: onFileAnswerChange menaruh objek File pada bag jawaban', async () => {
        const wrapper = mountInvitationWithFields(
            [invitationField({ name: 'dokumen', label: 'Dokumen', type: 'fileUpload' })],
            {}
        );
        try {
            const file = new File(['isi berkas'], 'berkas.txt', { type: 'text/plain' });
            const fileInput = wrapper.find<HTMLInputElement>('input[type="file"]');
            Object.defineProperty(fileInput.element, 'files', { value: [file], configurable: true });

            await fileInput.trigger('change');

            expect(confirmFormState()['dokumen']).toBeInstanceOf(File);
        } finally {
            wrapper.unmount();
        }
    });

    it('hardening: nilai non-string di bag dirender string kosong', async () => {
        const wrapper = mountInvitationWithFields(
            [invitationField({ name: 'catatan', label: 'Catatan', type: 'input' })],
            { catatan: 'Awal' }
        );
        try {
            // hardening pasca-refactor: textAnswer memetakan non-string ke '' (dulu nilai mentah lolos).
            confirmFormState()['catatan'] = ['sisa draft'];
            await nextTick();

            expect(wrapper.find<HTMLInputElement>('input').element.value).toBe('');
        } finally {
            wrapper.unmount();
        }
    });
});
