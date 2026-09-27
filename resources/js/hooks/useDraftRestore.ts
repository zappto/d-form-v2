import { computed, onBeforeUnmount, onMounted, type ComputedRef, type Ref } from 'vue';
import { RESPONDENT_DRAFT_DEBOUNCE_MS } from '@/lib/debounce';
import { formatSavedTimeLabel } from '@/lib/format';
import type { TFormFillAnswerMap } from '@/types/form';
import { snapshotRespondentValues, useRespondentDraft, type IUseRespondentDraftResult } from './useRespondentDraft';
import type { TAutosaveStatus } from './useAutosaveSync';

/** Snapshot draft tersimpan untuk form tanpa field ekstra: peta jawaban responden. */
export interface IDraftValuesSnapshot {
    values: TFormFillAnswerMap;
}

/** Argumen useDraftRestore: snapshot teks + kunci storage + cara menuang draft ke form. */
export interface IDraftRestoreArgs {
    snapshot: () => string;
    storageKey: string;
    restoreIntoForm: (draft: IDraftValuesSnapshot) => void;
}

/** Hasil useDraftRestore: status, label jam, clear saat sukses, flush sebelum submit. */
export interface IDraftRestoreResult {
    status: Ref<TAutosaveStatus>;
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
    const draft: IUseRespondentDraftResult<IDraftValuesSnapshot> = useRespondentDraft<IDraftValuesSnapshot>(
        args.snapshot,
        args.storageKey,
        {
            debounceMs: RESPONDENT_DRAFT_DEBOUNCE_MS,
        }
    );

    const savedTimeLabel: ComputedRef<string> = computed<string>((): string =>
        formatSavedTimeLabel(draft.lastSavedAt.value)
    );

    onMounted((): void => {
        const parsed: IDraftValuesSnapshot | null = draft.restore();
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
