import { useForm } from '@inertiajs/vue3';
import type { InertiaForm } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';
import { useErrorToast } from './useErrorToast';

/** Isian form konten email broadcast (subject + konteks event + HTML Tiptap). */
export interface IBroadcastContentFields {
    subject: string;
    content: string;
    event_id: string;
}

/** Argumen form konten broadcast (id + nilai awal; objek tunggal agar ≤2 parameter). */
export interface IBroadcastContentFormArgs {
    broadcastId: string;
    initialSubject: string;
    initialContent: string;
    initialEventId: string;
}

/** Hasil form konten broadcast (form + penyimpan). */
export interface IBroadcastContentFormResult {
    contentForm: InertiaForm<IBroadcastContentFields>;
    saveContent: () => void;
}

/** Form konten email broadcast (subject + event context + Tiptap); dipakai kartu Email Show. */
export function useBroadcastContentForm(args: IBroadcastContentFormArgs): IBroadcastContentFormResult {
    const { showErrorToast } = useErrorToast();
    const contentForm: InertiaForm<IBroadcastContentFields> = useForm<IBroadcastContentFields>({
        subject: args.initialSubject,
        content: args.initialContent,
        event_id: args.initialEventId,
    });

    function saveContent(): void {
        contentForm.post(routes.admin.broadcasts.content(args.broadcastId), {
            preserveScroll: true,
            onError: () => showErrorToast('Gagal menyimpan email. Periksa variable {{name}}/{{event_name}}.'),
        });
    }

    return { contentForm, saveContent };
}
