import { ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { useErrorToast } from './useErrorToast';
import { routes } from '@/lib/routes';

/** Argumen useUserDeletion: id target + izin hapus dari props Inertia. */
export interface IUseUserDeletionArgs {
    userId: string;
    canDelete: boolean;
}

/** Hapus akun dari detail pengguna via modal konfirmasi + router.delete; dipakai di Users/Show. */
export function useUserDeletion(args: IUseUserDeletionArgs) {
    const { showErrorToast } = useErrorToast();
    const isDeleting = ref(false);
    const showDeleteModal = ref(false);

    /** Hapus akun; kunci request ganda dan tolak bila tanpa izin hapus. */
    function confirmDelete(): void {
        if (isDeleting.value || !args.canDelete) return;
        isDeleting.value = true;
        router.delete(routes.admin.users.destroy(args.userId), {
            onError: () => showErrorToast('Gagal menghapus akun.'),
            onFinish: () => {
                isDeleting.value = false;
                showDeleteModal.value = false;
            },
        });
    }

    return { isDeleting, showDeleteModal, confirmDelete };
}
