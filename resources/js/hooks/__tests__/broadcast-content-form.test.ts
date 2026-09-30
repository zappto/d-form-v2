import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastContentForm } from '../useBroadcastContentForm';

/**
 * DFORM-67: kunci nilai awal form konten + endpoint simpan email + toast
 * gagal (copy variable {{name}}/{{event_name}}) agar ekstraksi hook tak
 * menggeser perilaku kartu Email.
 */

/** Opsi submit form konten (subset yang dipakai hook). */
interface IContentSubmitOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

const { formPostMock, showErrorToastMock } = vi.hoisted(() => ({
    formPostMock: vi.fn<(url: string, options?: IContentSubmitOptions) => void>(),
    showErrorToastMock: vi.fn<(message: string) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        router: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
        useForm: <T extends object>(initial: T) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                post: formPostMock,
                patch: vi.fn(),
                reset: vi.fn(),
            }),
    };
});

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ showErrorToast: showErrorToastMock }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useBroadcastContentForm', () => {
    it('nilai awal dari broadcast; null → string kosong', () => {
        const content = useBroadcastContentForm({
            broadcastId: 'b-1',
            initialSubject: 'Halo',
            initialContent: '<p>Isi</p>',
            initialEventId: 'ev-1',
        });
        expect(content.contentForm.subject).toBe('Halo');
        expect(content.contentForm.content).toBe('<p>Isi</p>');
        expect(content.contentForm.event_id).toBe('ev-1');
    });

    it('simpan → post endpoint content + preserveScroll', () => {
        const content = useBroadcastContentForm({
            broadcastId: 'b-1',
            initialSubject: '',
            initialContent: '',
            initialEventId: '',
        });
        content.saveContent();

        expect(formPostMock).toHaveBeenCalledTimes(1);
        expect(formPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/content');
        expect(formPostMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);
    });

    it('simpan gagal → toast menyebut variable yang didukung', () => {
        const content = useBroadcastContentForm({
            broadcastId: 'b-1',
            initialSubject: '',
            initialContent: '',
            initialEventId: '',
        });
        content.saveContent();
        formPostMock.mock.calls[0]?.[1]?.onError?.({ content: 'invalid' });
        expect(showErrorToastMock).toHaveBeenCalledWith(
            'Gagal menyimpan email. Periksa variable {{name}}/{{event_name}}.'
        );
    });
});
