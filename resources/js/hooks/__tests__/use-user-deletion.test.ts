import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useUserDeletion } from '../useUserDeletion';
import { routes } from '@/lib/routes';

/**
 * DFORM-68: pin perilaku hapus Users/Show setelah ekstraksi ke hook —
 * URL destroy, toast gagal, dan reset flag harus identik dengan implementasi inline semula.
 */

const { showErrorToastMock } = vi.hoisted(() => ({
    showErrorToastMock: vi.fn<(message: string) => void>(),
}));

const { routerDeleteMock } = vi.hoisted(() => ({
    routerDeleteMock: vi.fn<(url: string, options?: IRouterMutationOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', () => ({
    router: { post: vi.fn(), get: vi.fn(), delete: routerDeleteMock, reload: vi.fn(), visit: vi.fn() },
}));

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ showErrorToast: showErrorToastMock }),
}));

interface IRouterMutationOptions {
    onError?: () => void;
    onFinish?: () => void;
}

function lastDeleteCall(): { url: string; options: IRouterMutationOptions } {
    expect(routerDeleteMock).toHaveBeenCalled();
    const calls = routerDeleteMock.mock.calls;
    const last = calls[calls.length - 1];
    if (!last) throw new Error('panggilan router.delete tidak ditemukan');
    const options = last[1];
    if (!options) throw new Error('opsi delete tidak ditemukan');
    return { url: last[0], options };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useUserDeletion (DFORM-68)', () => {
    it('confirm → router.delete ke URL destroy + isDeleting selama request', () => {
        const deletion = useUserDeletion({ userId: 'u-1', canDelete: true });

        deletion.showDeleteModal.value = true;
        deletion.confirmDelete();

        const call = lastDeleteCall();
        expect(call.url).toBe(routes.admin.users.destroy('u-1'));
        expect(deletion.isDeleting.value).toBe(true);
    });

    it('finish → isDeleting pulih + modal tertutup', () => {
        const deletion = useUserDeletion({ userId: 'u-1', canDelete: true });
        deletion.showDeleteModal.value = true;

        deletion.confirmDelete();
        lastDeleteCall().options.onFinish?.();

        expect(deletion.isDeleting.value).toBe(false);
        expect(deletion.showDeleteModal.value).toBe(false);
    });

    it('tanpa izin hapus → router.delete tidak dipanggil', () => {
        const deletion = useUserDeletion({ userId: 'u-1', canDelete: false });

        deletion.confirmDelete();

        expect(routerDeleteMock).not.toHaveBeenCalled();
        expect(deletion.isDeleting.value).toBe(false);
    });

    it('confirm ganda selama request → satu panggilan saja', () => {
        const deletion = useUserDeletion({ userId: 'u-1', canDelete: true });

        deletion.confirmDelete();
        deletion.confirmDelete();

        expect(routerDeleteMock).toHaveBeenCalledTimes(1);
    });

    it('gagal → toast "Gagal menghapus akun." + flag pulih setelah finish', () => {
        const deletion = useUserDeletion({ userId: 'u-1', canDelete: true });

        deletion.confirmDelete();
        const call = lastDeleteCall();
        call.options.onError?.();

        expect(showErrorToastMock).toHaveBeenCalledWith('Gagal menghapus akun.');

        call.options.onFinish?.();
        expect(deletion.isDeleting.value).toBe(false);
        expect(deletion.showDeleteModal.value).toBe(false);
    });
});
