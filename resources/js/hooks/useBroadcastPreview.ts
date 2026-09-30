import { router } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';

/** Argumen pratinjau broadcast (objek tunggal agar ≤2 parameter). */
export interface IBroadcastPreviewArgs {
    broadcastId: string;
}

/** Hasil pratinjau broadcast (pemuatan partial preview). */
export interface IBroadcastPreviewResult {
    loadPreview: () => void;
}

/** Muat pratinjau render email via endpoint partial; dipakai tombol "Muat preview" Show. */
export function useBroadcastPreview(args: IBroadcastPreviewArgs): IBroadcastPreviewResult {
    function loadPreview(): void {
        router.get(
            routes.admin.broadcasts.preview(args.broadcastId),
            {},
            { preserveState: true, preserveScroll: true, only: ['preview'] }
        );
    }

    return { loadPreview };
}
