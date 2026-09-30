import { ref } from 'vue';
import type { Ref } from 'vue';
import { useForm } from '@inertiajs/vue3';
import type { InertiaForm } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';
import { useErrorToast } from './useErrorToast';
import type { IBroadcastSnapshotManualEntry } from './useBroadcastShowTypes';

/** Sumber dataset yang dicentang bawaan saat kartu snapshot dibuka. */
const DEFAULT_SNAPSHOT_SOURCES: string[] = ['users'];

/** Isian form snapshot broadcast (dataset + manual + berkas CSV). */
export interface IBroadcastSnapshotFields {
    datasets: Array<Record<string, string>>;
    manual: IBroadcastSnapshotManualEntry[];
    csv_file: File | null;
}

/** Argumen form snapshot broadcast (objek tunggal agar ≤2 parameter). */
export interface IBroadcastSnapshotFormArgs {
    broadcastId: string;
}

/** Hasil form snapshot broadcast (state pilihan + form + pemicu generate). */
export interface IBroadcastSnapshotFormResult {
    selectedSources: Ref<string[]>;
    manualRows: Ref<string>;
    snapshotForm: InertiaForm<IBroadcastSnapshotFields>;
    generateSnapshot: () => void;
    onCsv: (event: Event) => void;
}

/** Ubah satu baris textarea menjadi entri manual ("Nama,email" atau "email" saja); dipakai generateSnapshot. */
function toSnapshotManualEntry(line: string): IBroadcastSnapshotManualEntry {
    const segments: string[] = line.split(',').map((segment: string): string => segment.trim());
    const emailCandidate: string | undefined = segments.length > 1 ? segments[1] : undefined;
    if (emailCandidate !== undefined && emailCandidate.includes('@')) {
        const nameSegment: string | undefined = segments[0];
        return { name: nameSegment === undefined || nameSegment === '' ? null : nameSegment, email: emailCandidate };
    }
    return { name: null, email: line };
}

/** Form dataset & snapshot broadcast (sumber + manual + CSV → generate); dipakai kartu Dataset Show. */
export function useBroadcastSnapshotForm(args: IBroadcastSnapshotFormArgs): IBroadcastSnapshotFormResult {
    const { showErrorToast } = useErrorToast();
    const selectedSources: Ref<string[]> = ref<string[]>([...DEFAULT_SNAPSHOT_SOURCES]);
    const manualRows: Ref<string> = ref<string>('');
    const snapshotForm: InertiaForm<IBroadcastSnapshotFields> = useForm<IBroadcastSnapshotFields>({
        datasets: [],
        manual: [],
        csv_file: null,
    });

    function generateSnapshot(): void {
        snapshotForm.datasets = selectedSources.value.map((sourceType: string): Record<string, string> => ({
            type: sourceType,
        }));
        snapshotForm.manual = manualRows.value
            .split('\n')
            .map((line: string): string => line.trim())
            .filter(Boolean)
            .map(toSnapshotManualEntry);
        snapshotForm.post(routes.admin.broadcasts.snapshot(args.broadcastId), {
            preserveScroll: true,
            forceFormData: true,
            onError: () => showErrorToast('Gagal generate snapshot.'),
        });
    }

    function onCsv(event: Event): void {
        if (!(event.target instanceof HTMLInputElement)) return;
        snapshotForm.csv_file = event.target.files?.[0] ?? null;
    }

    return { selectedSources, manualRows, snapshotForm, generateSnapshot, onCsv };
}
