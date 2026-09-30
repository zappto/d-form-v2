import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastRecipientsPanel } from '../useBroadcastRecipientsPanel';

/**
 * DFORM-67: kunci endpoint recipients (tambah + hapus + muat partial
 * recipients.index) + reset-on-success + toast gagal agar ekstraksi hook
 * tak menggeser perilaku kartu Recipients.
 */

/** Opsi submit form recipients (subset yang dipakai hook). */
interface IRecipientSubmitOptions {
    preserveScroll?: boolean;
    preserveState?: boolean;
    only?: string[];
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

const { formPostMock, formResetMock, routerDeleteMock, routerGetMock, showErrorToastMock } = vi.hoisted(() => ({
    formPostMock: vi.fn<(url: string, options?: IRecipientSubmitOptions) => void>(),
    formResetMock: vi.fn<() => void>(),
    routerDeleteMock: vi.fn<(url: string, options?: IRecipientSubmitOptions) => void>(),
    routerGetMock: vi.fn<(url: string, data?: Record<string, string>, options?: IRecipientSubmitOptions) => void>(),
    showErrorToastMock: vi.fn<(message: string) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        router: { get: routerGetMock, post: vi.fn(), delete: routerDeleteMock },
        useForm: <T extends object>(initial: T) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                post: formPostMock,
                patch: vi.fn(),
                reset: formResetMock,
            }),
    };
});

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ showErrorToast: showErrorToastMock }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useBroadcastRecipientsPanel', () => {
    it('tambah → post endpoint recipients + reset saat sukses', () => {
        const panel = useBroadcastRecipientsPanel({ broadcastId: 'b-1' });
        panel.recipientForm.name = 'Nafan';
        panel.recipientForm.email = 'nafan@gmail.com';
        panel.addRecipient();

        expect(formPostMock).toHaveBeenCalledTimes(1);
        expect(formPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/recipients');
        expect(formPostMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);

        formPostMock.mock.calls[0]?.[1]?.onSuccess?.();
        expect(formResetMock).toHaveBeenCalledTimes(1);
    });

    it('tambah gagal → toast tanpa reset', () => {
        const panel = useBroadcastRecipientsPanel({ broadcastId: 'b-1' });
        panel.addRecipient();
        formPostMock.mock.calls[0]?.[1]?.onError?.({ email: 'wajib' });
        expect(showErrorToastMock).toHaveBeenCalledWith('Gagal menambah recipient.');
        expect(formResetMock).not.toHaveBeenCalled();
    });

    it('hapus → delete ke /recipients/{id}; gagal → toast', () => {
        const panel = useBroadcastRecipientsPanel({ broadcastId: 'b-1' });
        panel.deleteRecipient('r-9');

        expect(routerDeleteMock).toHaveBeenCalledTimes(1);
        expect(routerDeleteMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/recipients/r-9');
        expect(routerDeleteMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);

        routerDeleteMock.mock.calls[0]?.[1]?.onError?.({ id: 'hilang' });
        expect(showErrorToastMock).toHaveBeenCalledWith('Gagal menghapus recipient.');
    });

    it('muat → get partial hanya recipients + duplicateSummary', () => {
        const panel = useBroadcastRecipientsPanel({ broadcastId: 'b-1' });
        panel.loadRecipients();

        expect(routerGetMock).toHaveBeenCalledTimes(1);
        expect(routerGetMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/recipients');
        expect(routerGetMock.mock.calls[0]?.[2]?.preserveState).toBe(true);
        expect(routerGetMock.mock.calls[0]?.[2]?.preserveScroll).toBe(true);
        expect(routerGetMock.mock.calls[0]?.[2]?.only).toEqual(['recipients', 'duplicateSummary']);
    });
});
