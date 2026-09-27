import { watch } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { showFlashToast } from '@/lib/error-message';

type FlashToast = { type?: string; message?: string } | null | undefined;

/** Memantau flash `toast` dari server dan menampilkannya; dipasang sekali di layout agar toast muncul lintas halaman. */
export function usePageFlashToast(): void {
    const page = usePage();

    watch(
        () => (page.flash as { toast?: FlashToast } | undefined)?.toast,
        (toastPayload) => {
            showFlashToast(toastPayload);
        },
        { immediate: true }
    );
}
