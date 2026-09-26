import { ref, watch, type Ref } from 'vue';

export type AutosaveStatus = 'idle' | 'saving' | 'saved';

export interface AutosaveStorage {
    read(key: string): string | null;
    write(key: string, value: string): void;
    remove(key: string): void;
}

export interface UseAutosaveSyncOptions {
    debounceMs?: number;
    enabled?: Ref<boolean> | boolean;
    onError?: (message: string) => void;
    storage?: AutosaveStorage;
    storageKey?: string;
}

export interface UseAutosaveSyncResult {
    status: Ref<AutosaveStatus>;
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
export function useAutosaveSync(
    source: () => string,
    save: (snapshot: string) => Promise<boolean>,
    opts: UseAutosaveSyncOptions = {},
): UseAutosaveSyncResult {
    const debounceMs = opts.debounceMs ?? 800;
    const status = ref<AutosaveStatus>('idle');
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let saveSeq = 0;
    let saving = false;
    let queued = false;

    function isEnabled(): boolean {
        if (typeof opts.enabled === 'boolean') return opts.enabled;
        if (opts.enabled) return opts.enabled.value;
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
        if (opts.storage && opts.storageKey) {
            opts.storage.write(opts.storageKey, source());
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
                    const didWork = await save(source());
                    if (seq === saveSeq && !queued) status.value = didWork ? 'saved' : 'idle';
                } catch (err) {
                    if (seq === saveSeq && !queued) {
                        status.value = 'idle';
                        (opts.onError ?? (() => {}))(err instanceof Error ? err.message : 'Gagal menyimpan otomatis.');
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

    watch(source, () => {
        schedule();
    });

    return { status, schedule, flush, cancel };
}
