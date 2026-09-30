import { router, useForm } from '@inertiajs/vue3';
import type { InertiaForm } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';
import { useErrorToast } from './useErrorToast';

/** Isian form tambah recipient manual. */
export interface IBroadcastRecipientFields {
    name: string;
    email: string;
}

/** Argumen panel recipients broadcast (objek tunggal agar ≤2 parameter). */
export interface IBroadcastRecipientsPanelArgs {
    broadcastId: string;
}

/** Hasil panel recipients broadcast (form tambah + hapus + muat partial). */
export interface IBroadcastRecipientsPanelResult {
    recipientForm: InertiaForm<IBroadcastRecipientFields>;
    addRecipient: () => void;
    deleteRecipient: (recipientId: string) => void;
    loadRecipients: () => void;
}

/** Panel recipients manual broadcast (tambah + hapus + muat partial); dipakai kartu Recipients Show. */
export function useBroadcastRecipientsPanel(args: IBroadcastRecipientsPanelArgs): IBroadcastRecipientsPanelResult {
    const { showErrorToast } = useErrorToast();
    const recipientForm: InertiaForm<IBroadcastRecipientFields> = useForm<IBroadcastRecipientFields>({
        name: '',
        email: '',
    });

    function addRecipient(): void {
        recipientForm.post(routes.admin.broadcasts.recipients(args.broadcastId), {
            preserveScroll: true,
            onSuccess: () => recipientForm.reset(),
            onError: () => showErrorToast('Gagal menambah recipient.'),
        });
    }

    function deleteRecipient(recipientId: string): void {
        router.delete(`${routes.admin.broadcasts.recipients(args.broadcastId)}/${recipientId}`, {
            preserveScroll: true,
            onError: () => showErrorToast('Gagal menghapus recipient.'),
        });
    }

    /** Muat daftar recipients via endpoint partial recipients.index; dipakai tombol "Muat recipients". */
    function loadRecipients(): void {
        router.get(
            routes.admin.broadcasts.recipients(args.broadcastId),
            {},
            { preserveState: true, preserveScroll: true, only: ['recipients', 'duplicateSummary'] }
        );
    }

    return { recipientForm, addRecipient, deleteRecipient, loadRecipients };
}
