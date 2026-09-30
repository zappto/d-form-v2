import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastPreview } from '../useBroadcastPreview';

/**
 * DFORM-67: kunci endpoint pratinjau (partial only preview) agar ekstraksi
 * hook tak menggeser perilaku tombol "Muat preview".
 */

/** Opsi get pratinjau (subset yang dipakai hook). */
interface IPreviewGetOptions {
    preserveScroll?: boolean;
    preserveState?: boolean;
    only?: string[];
}

const { routerGetMock } = vi.hoisted(() => ({
    routerGetMock: vi.fn<(url: string, data?: Record<string, string>, options?: IPreviewGetOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', () => ({
    router: { get: routerGetMock, post: vi.fn(), delete: vi.fn() },
    useForm: vi.fn(),
}));

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ showErrorToast: vi.fn() }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useBroadcastPreview', () => {
    it('muat → get partial hanya preview', () => {
        const preview = useBroadcastPreview({ broadcastId: 'b-1' });
        preview.loadPreview();

        expect(routerGetMock).toHaveBeenCalledTimes(1);
        expect(routerGetMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/preview');
        expect(routerGetMock.mock.calls[0]?.[2]?.preserveState).toBe(true);
        expect(routerGetMock.mock.calls[0]?.[2]?.preserveScroll).toBe(true);
        expect(routerGetMock.mock.calls[0]?.[2]?.only).toEqual(['preview']);
    });
});
