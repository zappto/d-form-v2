import { router, useForm } from '@inertiajs/vue3';
import type { InertiaForm } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';
import { useErrorToast } from './useErrorToast';

/** Isian form unggah lampiran broadcast. */
export interface IBroadcastAttachmentFields {
    file: File | null;
}

/** Argumen lampiran broadcast (objek tunggal agar ≤2 parameter). */
export interface IBroadcastAttachmentsArgs {
    broadcastId: string;
}

/** Hasil lampiran broadcast (form + unggah + hapus + penyalin input berkas). */
export interface IBroadcastAttachmentsResult {
    attachForm: InertiaForm<IBroadcastAttachmentFields>;
    uploadAttachment: () => void;
    deleteAttachment: (attachmentId: string) => void;
    handleAttachmentFileInput: (event: Event) => void;
}

/** Lampiran broadcast (pilih berkas + unggah + hapus); dipakai blok Attachments Show. */
export function useBroadcastAttachments(args: IBroadcastAttachmentsArgs): IBroadcastAttachmentsResult {
    const { showErrorToast } = useErrorToast();
    const attachForm: InertiaForm<IBroadcastAttachmentFields> = useForm<IBroadcastAttachmentFields>({ file: null });

    function uploadAttachment(): void {
        attachForm.post(routes.admin.broadcasts.attachments(args.broadcastId), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => attachForm.reset(),
            onError: () => showErrorToast('Attachment maks 1.5 MB.'),
        });
    }

    function deleteAttachment(attachmentId: string): void {
        router.delete(`${routes.admin.broadcasts.attachments(args.broadcastId)}/${attachmentId}`, {
            preserveScroll: true,
        });
    }

    /** Salin berkas terpilih dari input ke form; abaikan event bukan dari input berkas. */
    function handleAttachmentFileInput(event: Event): void {
        if (!(event.target instanceof HTMLInputElement)) return;
        attachForm.file = event.target.files?.[0] ?? null;
    }

    return { attachForm, uploadAttachment, deleteAttachment, handleAttachmentFileInput };
}
