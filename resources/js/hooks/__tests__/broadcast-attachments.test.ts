import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastAttachments } from '../useBroadcastAttachments';

/**
 * DFORM-67: kunci unggah lampiran (forceFormData + reset-on-success +
 * toast batas 1.5 MB) + hapus + penyalin input berkas agar ekstraksi hook
 * tak menggeser perilaku blok Attachments.
 */

/** Opsi submit form lampiran (subset yang dipakai hook). */
interface IAttachmentSubmitOptions {
    preserveScroll?: boolean;
    forceFormData?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

const { formPostMock, formResetMock, routerDeleteMock, showErrorToastMock } = vi.hoisted(() => ({
    formPostMock: vi.fn<(url: string, options?: IAttachmentSubmitOptions) => void>(),
    formResetMock: vi.fn<() => void>(),
    routerDeleteMock: vi.fn<(url: string, options?: IAttachmentSubmitOptions) => void>(),
    showErrorToastMock: vi.fn<(message: string) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        router: { get: vi.fn(), post: vi.fn(), delete: routerDeleteMock },
        useForm: <T extends object>(initial: T) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                post: formPostMock,
                patch: vi.fn(),
                reset: formResetMock,
            }),
    };
});

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ showErrorToast: showErrorToastMock }),
}));

/** Event change palsu dengan berkas terpilih pada input. */
function fakeFileInputEvent(files: File[]): Event {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: input, configurable: true });
    return event;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useBroadcastAttachments', () => {
    it('unggah → post endpoint attachments + forceFormData + reset saat sukses', () => {
        const attachments = useBroadcastAttachments({ broadcastId: 'b-1' });
        attachments.uploadAttachment();

        expect(formPostMock).toHaveBeenCalledTimes(1);
        expect(formPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/attachments');
        expect(formPostMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);
        expect(formPostMock.mock.calls[0]?.[1]?.forceFormData).toBe(true);

        formPostMock.mock.calls[0]?.[1]?.onSuccess?.();
        expect(formResetMock).toHaveBeenCalledTimes(1);
    });

    it('unggah gagal → toast batas ukuran', () => {
        const attachments = useBroadcastAttachments({ broadcastId: 'b-1' });
        attachments.uploadAttachment();
        formPostMock.mock.calls[0]?.[1]?.onError?.({ file: 'kebesaran' });
        expect(showErrorToastMock).toHaveBeenCalledWith('Attachment maks 1.5 MB.');
    });

    it('hapus → delete ke /attachments/{id} tanpa toast', () => {
        const attachments = useBroadcastAttachments({ broadcastId: 'b-1' });
        attachments.deleteAttachment('a-7');

        expect(routerDeleteMock).toHaveBeenCalledTimes(1);
        expect(routerDeleteMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/attachments/a-7');
        expect(routerDeleteMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);
        expect(showErrorToastMock).not.toHaveBeenCalled();
    });

    it('input berkas menyalin File; kosong → null; target non-input diabaikan', () => {
        const attachments = useBroadcastAttachments({ broadcastId: 'b-1' });
        const pdf = new File(['isi'], 'flyer.pdf', { type: 'application/pdf' });

        attachments.handleAttachmentFileInput(fakeFileInputEvent([pdf]));
        expect(attachments.attachForm.file?.name).toBe('flyer.pdf');

        attachments.handleAttachmentFileInput(fakeFileInputEvent([]));
        expect(attachments.attachForm.file).toBeNull();

        attachments.handleAttachmentFileInput(new Event('change'));
        expect(attachments.attachForm.file).toBeNull();
    });
});
