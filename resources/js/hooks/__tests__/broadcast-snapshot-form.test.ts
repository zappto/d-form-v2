import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastSnapshotForm } from '../useBroadcastSnapshotForm';

/**
 * DFORM-67: kunci payload snapshot (datasets dari sumber terpilih, parse
 * baris manual, berkas CSV) + endpoint + guard input agar ekstraksi hook
 * tak menggeser perilaku kartu Dataset & Snapshot.
 */

/** Opsi submit form snapshot (subset yang dipakai hook). */
interface ISnapshotSubmitOptions {
    preserveScroll?: boolean;
    forceFormData?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

const { formPostMock, showErrorToastMock } = vi.hoisted(() => ({
    formPostMock: vi.fn<(url: string, options?: ISnapshotSubmitOptions) => void>(),
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

/** Event change palsu dengan berkas terpilih pada input. */
function fakeFileInputEvent(files: File[]): Event {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: input, configurable: true });
    return event;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useBroadcastSnapshotForm', () => {
    it('sumber bawaan users; generate memetakan sumber ke datasets', () => {
        const snapshot = useBroadcastSnapshotForm({ broadcastId: 'b-1' });
        expect(snapshot.selectedSources.value).toEqual(['users']);

        snapshot.selectedSources.value = ['users', 'event_participants'];
        snapshot.generateSnapshot();

        expect(formPostMock).toHaveBeenCalledTimes(1);
        expect(formPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/snapshot');
        expect(formPostMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);
        expect(formPostMock.mock.calls[0]?.[1]?.forceFormData).toBe(true);
        expect(snapshot.snapshotForm.datasets).toEqual([{ type: 'users' }, { type: 'event_participants' }]);
    });

    it('parse manual: "Nama,email" berpasangan, email saja tanpa nama, baris kosong diabaikan', () => {
        const snapshot = useBroadcastSnapshotForm({ broadcastId: 'b-1' });
        snapshot.manualRows.value = 'Nafan,nafan@gmail.com\n\nbudi@gmail.com\n  \nTanpa At,salah-format';
        snapshot.generateSnapshot();

        expect(snapshot.snapshotForm.manual).toEqual([
            { name: 'Nafan', email: 'nafan@gmail.com' },
            { name: null, email: 'budi@gmail.com' },
            { name: null, email: 'Tanpa At,salah-format' },
        ]);
    });

    it('gagal generate → toast sekali tanpa throw', () => {
        const snapshot = useBroadcastSnapshotForm({ broadcastId: 'b-1' });
        snapshot.generateSnapshot();
        formPostMock.mock.calls[0]?.[1]?.onError?.({ datasets: 'wajib' });
        expect(showErrorToastMock).toHaveBeenCalledWith('Gagal generate snapshot.');
    });

    it('onCsv menyalin berkas terpilih; input kosong → null; target non-input diabaikan', () => {
        const snapshot = useBroadcastSnapshotForm({ broadcastId: 'b-1' });
        const csv = new File(['name,email'], 'data.csv', { type: 'text/csv' });

        snapshot.onCsv(fakeFileInputEvent([csv]));
        expect(snapshot.snapshotForm.csv_file?.name).toBe('data.csv');

        snapshot.onCsv(fakeFileInputEvent([]));
        expect(snapshot.snapshotForm.csv_file).toBeNull();

        snapshot.onCsv(new Event('change'));
        expect(snapshot.snapshotForm.csv_file).toBeNull();
    });
});
