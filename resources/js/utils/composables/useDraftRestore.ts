import { computed, onBeforeUnmount, onMounted, type ComputedRef, type Ref } from 'vue';
import { formatSavedTimeLabel } from '@/lib/format';
import { snapshotRespondentValues, useRespondentDraft, type UseRespondentDraftResult } from './useRespondentDraft';
import type { AutosaveStatus } from './useAutosaveSync';

/** Debounce tunggal draft responden; sama dengan autosave builder agar indikator seragam. */
const RESPONDENT_DRAFT_DEBOUNCE_MS = 800;

/** Argumen useDraftRestore: snapshot teks + kunci storage + cara menuang draft ke form. */
export interface IDraftRestoreArgs {
    snapshot: () => string;
    storageKey: string;
    restoreIntoForm: (draft: unknown) => void;
}

/** Hasil useDraftRestore: status, label jam, clear saat sukses, flush sebelum submit. */
export interface IDraftRestoreResult {
    status: Ref<AutosaveStatus>;
    lastSavedAt: Ref<Date | null>;
    savedTimeLabel: ComputedRef<string>;
    clear: () => void;
    flush: () => Promise<void>;
}

/** Snapshot `{ values }` tanpa File/kunci Inertia; dipakai empat form tanpa field ekstra. */
export function buildValuesDraftSnapshot(form: unknown): string {
    return JSON.stringify({ values: snapshotRespondentValues(form) });
}

/** Bungkus useRespondentDraft + restore toleran saat mount + cancel saat unmount. */
export function useDraftRestore(args: IDraftRestoreArgs): IDraftRestoreResult {
    const draft: UseRespondentDraftResult<unknown> = useRespondentDraft<unknown>(args.snapshot, args.storageKey, {
        debounceMs: RESPONDENT_DRAFT_DEBOUNCE_MS,
    });

    const savedTimeLabel: ComputedRef<string> = computed<string>((): string =>
        formatSavedTimeLabel(draft.lastSavedAt.value),
    );

    onMounted((): void => {
        const parsed: unknown = draft.restore();
        if (parsed === null) return;
        args.restoreIntoForm(parsed);
    });

    onBeforeUnmount((): void => {
        draft.cancel();
    });

    return {
        status: draft.status,
        lastSavedAt: draft.lastSavedAt,
        savedTimeLabel,
        clear: draft.clear,
        flush: draft.flush,
    };
}
