import { ref, watch, type Ref } from 'vue';
import { AUTOSAVE_DEBOUNCE_MS } from '@/lib/debounce';

export type TAutosaveStatus = 'idle' | 'saving' | 'saved';

export interface IAutosaveStorage {
    read(key: string): string | null;
    write(key: string, value: string): void;
    remove(key: string): void;
}

export interface IUseAutosaveSyncOptions {
    debounceMs?: number;
    enabled?: Ref<boolean> | boolean;
    onError?: (message: string) => void;
    storage?: IAutosaveStorage;
    storageKey?: string;
}

export interface IUseAutosaveSyncResult {
    status: Ref<TAutosaveStatus>;
    schedule: () => void;
    flush: () => Promise<void>;
    cancel: () => void;
}

/**
 * Auto-sync global: optimistik (UI berubah duluan) + debounce (remote belakangan).
 * Halaman menyuplai `source` (snapshot serial) dan `save` (cara menyimpan).
 *
 * Anti-race: save tidak pernah overlap — flush yang dipanggil saat save
 * sebelumnya masih in-flight hanya mengantrekan SATU flush susulan yang jalan
 * setelah save aktif selesai (bukan paralel). Guard seq dipertahankan untuk
 * status agar hasil basi tidak menimpa status terbaru.
 */
/** Argumen auto-sync global (sumber snapshot + penyimpan + opsi debounce/storage/gerbang). */
export interface IUseAutosaveSyncArgs extends IUseAutosaveSyncOptions {
    source: () => string;
    save: (snapshot: string) => Promise<boolean>;
}

export function useAutosaveSync(args: IUseAutosaveSyncArgs): IUseAutosaveSyncResult {
    const debounceMs = args.debounceMs ?? AUTOSAVE_DEBOUNCE_MS;
    const status = ref<TAutosaveStatus>('idle');
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let saveSeq = 0;
    let saving = false;
    let queued = false;

    function isEnabled(): boolean {
        if (typeof args.enabled === 'boolean') return args.enabled;
        if (args.enabled) return args.enabled.value;
        return true;
    }

    function clearTimer(): void {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
    }

    function schedule(): void {
        if (!isEnabled()) return;
        if (args.storage && args.storageKey) {
            args.storage.write(args.storageKey, args.source());
        }
        clearTimer();
        debounceTimer = setTimeout(() => {
            void flush();
        }, debounceMs);
    }

    async function flush(): Promise<void> {
        clearTimer();
        if (!isEnabled()) return;
        if (saving) {
            queued = true;
            return;
        }
        saving = true;
        try {
            do {
                queued = false;
                const seq = ++saveSeq;
                status.value = 'saving';
                try {
                    const didWork = await args.save(args.source());
                    if (seq === saveSeq && !queued) status.value = didWork ? 'saved' : 'idle';
                } catch (err) {
                    if (seq === saveSeq && !queued) {
                        status.value = 'idle';
                        (args.onError ?? (() => {}))(err instanceof Error ? err.message : 'Gagal menyimpan otomatis.');
                    }
                }
            } while (queued);
        } finally {
            saving = false;
        }
    }

    function cancel(): void {
        clearTimer();
    }

    watch(args.source, () => {
        schedule();
    });

    return { status, schedule, flush, cancel };
}
