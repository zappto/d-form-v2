import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useAutosaveSync } from '../useAutosaveSync';

describe('useAutosaveSync debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('default 800 ms: save belum jalan di 799 ms, jalan tepat di 800 ms', async () => {
        const source = ref('a');
        const save = vi.fn(async () => true);
        const sync = useAutosaveSync({ source: () => source.value, save });

        sync.schedule();
        await vi.advanceTimersByTimeAsync(799);
        expect(save).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(save).toHaveBeenCalledTimes(1);
        sync.cancel();
    });

    it('debounceMs eksplisit menang atas default (mis. 0 di test)', async () => {
        const source = ref('a');
        const save = vi.fn(async () => true);
        const sync = useAutosaveSync({ source: () => source.value, save, debounceMs: 0 });

        sync.schedule();
        await vi.advanceTimersByTimeAsync(0);
        expect(save).toHaveBeenCalledTimes(1);
        sync.cancel();
    });
});
