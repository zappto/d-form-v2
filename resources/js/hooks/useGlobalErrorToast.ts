import { router } from '@inertiajs/vue3';
import { useErrorToast } from './useErrorToast';

/** Daftarkan penangan error navigasi Inertia (status >=500 / 419) sekali saat app start; dipanggil di setup root app. */
export function useGlobalErrorToast(): void {
    const { showErrorToast } = useErrorToast();

    router.on('invalid', (event) => {
        const status = event.detail.response?.status;
        if (typeof status === 'number' && status >= 500) {
            event.preventDefault();
            showErrorToast('Terjadi kesalahan server saat memuat halaman. Coba refresh');
        } else if (status === 419) {
            event.preventDefault();
            showErrorToast('Sesi tidak valid atau sudah habis. Muat ulang halaman lalu coba lagi.');
        }
    });
}
