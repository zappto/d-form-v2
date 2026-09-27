import { computed, ref, type Ref } from 'vue';
import type { TFormFillAnswerMap, TFormFillAnswerValue } from '@/types/form';
import { RESPONDENT_DRAFT_DEBOUNCE_MS } from '@/lib/debounce';
import { useAutosaveSync, type AutosaveStatus } from './useAutosaveSync';

export interface IUseRespondentDraftOptions {
    debounceMs?: number;
}

export interface IUseRespondentDraftResult<T> {
    status: Ref<AutosaveStatus>;
    lastSavedAt: Ref<Date | null>;
    restore: () => T | null;
    clear: () => void;
    schedule: () => void;
    flush: () => Promise<void>;
    cancel: () => void;
}

function readLocal(key: string): string | null {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeLocal(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* localStorage tidak tersedia — draft dilewati */
    }
}

function removeLocal(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* abaikan */
    }
}

/** Kunci internal Inertia useForm yang bukan isian responden. */
const INERTIA_INTERNAL_KEYS: ReadonlySet<string> = new Set([
    'errors',
    'processing',
    'progress',
    'wasSuccessful',
    'recentlySuccessful',
    'isDirty',
    'hasErrors',
    'data',
    'post',
    'put',
    'patch',
    'delete',
    'get',
    'reset',
    'clearErrors',
    'setError',
    'transform',
    'cancel',
]);

/** Nilai mentah sumber form sebelum penyaringan; method internal dibuang saat iterasi. */
type TRawFormValues = Record<string, TFormFillAnswerValue>;

/** Bentuk Inertia `useForm` yang relevan: `.data()` mengembalikan peta jawaban mentah. */
interface IFormDataProvider {
    data: () => TRawFormValues;
}

/** True bila value menyediakan method `.data()` (Inertia asli); mock tanpa `.data()` memakai salinan properti. */
function isFormDataProvider(value: unknown): value is IFormDataProvider {
    return typeof value === 'object' && value !== null && 'data' in value && typeof value.data === 'function';
}

/** Salin properti enumerable sumber apa pun persis seperti spread objek (`{ ...form }`). */
function copyFormValues(value: unknown): TRawFormValues {
    const target: TRawFormValues = {};
    return Object.assign(target, value);
}

/**
 * Ambil isian responden dari Inertia useForm apa adanya:
 * - pakai `.data()` bila tersedia (Inertia asli),
 * - fallback ke properti langsung (mock vitest tanpa `.data()`).
 * File dikecualikan; fungsi + kunci internal Inertia dilewati.
 */
export function snapshotRespondentValues(form: unknown): TFormFillAnswerMap {
    let src: TRawFormValues;
    if (isFormDataProvider(form)) {
        try {
            src = form.data();
        } catch {
            src = copyFormValues(form);
        }
    } else {
        src = copyFormValues(form);
    }
    const values: TFormFillAnswerMap = {};
    for (const [key, value] of Object.entries(src)) {
        if (typeof value === 'function') continue;
        if (INERTIA_INTERNAL_KEYS.has(key)) continue;
        if (value instanceof File) continue;
        values[key] = value;
    }
    return values;
}

/**
 * Draft lokal responden (tanpa autosave server).
 * Bungkus useAutosaveSync dengan save no-op + sink localStorage sinkron.
 *
 * schedule-write = tersimpan: `lastSavedAt` di-set tiap write lokal sehingga
 * indikator "tersimpan" tampil walau `save` selalu false (status remote
 * useAutosaveSync tak pernah 'saved' untuk sink lokal).
 */
export function useRespondentDraft<T>(
    source: () => string,
    storageKey: string,
    opts: IUseRespondentDraftOptions = {}
): IUseRespondentDraftResult<T> {
    const lastSavedAt = ref<Date | null>(null);

    const autosave = useAutosaveSync(source, async () => false, {
        debounceMs: opts.debounceMs ?? RESPONDENT_DRAFT_DEBOUNCE_MS,
        storageKey,
        storage: {
            read: (key: string): string | null => readLocal(key),
            write: (key: string, value: string): void => {
                writeLocal(key, value);
                lastSavedAt.value = new Date();
            },
            remove: (key: string): void => removeLocal(key),
        },
        onError: () => {},
    });

    const status = computed<AutosaveStatus>((): AutosaveStatus => {
        if (lastSavedAt.value !== null) return 'saved';
        if (autosave.status.value === 'saving') return 'saving';
        return 'idle';
    });

    function restore(): T | null {
        const raw: string | null = readLocal(storageKey);
        if (!raw) return null;
        try {
            // `as T`: JSON.parse mengembalikan `any`; bentuk snapshot ditentukan pemanggil.
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    function clear(): void {
        autosave.cancel();
        removeLocal(storageKey);
        lastSavedAt.value = null;
    }

    return {
        status,
        lastSavedAt,
        restore,
        clear,
        schedule: autosave.schedule,
        flush: autosave.flush,
        cancel: autosave.cancel,
    };
}
