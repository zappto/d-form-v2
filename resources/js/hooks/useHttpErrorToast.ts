import { router } from '@inertiajs/vue3';
import { useErrorToast } from '@/hooks/useErrorToast';

let httpErrorToastRegistered = false;
let lastMutatingVisitMethod = 'get';

/** Simpan metode visit terakhir agar toast hanya untuk submit non-GET; dipanggil dari event router before. */
function rememberMutatingVisitMethod(method: string): void {
    lastMutatingVisitMethod = method.toLowerCase();
}

/** Tampilkan toast status saat submit non-GET mendarat di halaman Error; dipanggil dari event router success. */
function toastFailedMutatingVisitErrorPage(component: string, status: number): void {
    if (lastMutatingVisitMethod === 'get') return;
    if (component !== 'Error') return;
    const { showHttpErrorToast } = useErrorToast();
    showHttpErrorToast({ status });
}

/** Daftarkan toast submit gagal yang mendarat di halaman Error (mis. 403/500); dipanggil sekali di layout dashboard. */
export function useHttpErrorToast(): void {
    if (httpErrorToastRegistered) return;
    httpErrorToastRegistered = true;

    router.on('before', (event) => {
        rememberMutatingVisitMethod(event.detail.visit.method);
    });

    router.on('success', (event) => {
        const status = event.detail.page.props.status;
        if (typeof status !== 'number') return;
        toastFailedMutatingVisitErrorPage(event.detail.page.component, status);
    });
}
