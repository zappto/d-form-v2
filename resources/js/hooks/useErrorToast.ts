import { toast } from 'vue-sonner';
import {
    humanizeErrorMessage,
    parseApiErrorMessage,
    parseValidationErrors,
    type TErrorMessageContext,
    type TValidationErrors,
} from '@/lib/error-message';

type TErrorToastOptions = { title?: string; description?: string; duration?: number };
type TErrorToastContext = TErrorMessageContext & { title?: string };
type TFlashToastPayload = { type?: string; message?: string } | null | undefined;

/** Tampilkan toast validasi — ringkas untuk satu error, daftar untuk banyak error; dipakai setelah submit gagal validasi. */
function showValidationErrorToast(errors: TValidationErrors, ctx?: TErrorToastContext): void {
    const parsed = parseValidationErrors(errors, ctx);
    const title = ctx?.title ?? 'Validasi gagal';

    if (parsed.length === 0) {
        toast.error(title, {
            description: 'Periksa kembali formulir dan lengkapi field yang ditandai.',
        });
        return;
    }

    if (parsed.length === 1) {
        const only = parsed[0];
        toast.error(title, {
            description: `${only.label}: ${only.message}`,
            duration: 6000,
        });
        return;
    }

    toast.error(title, {
        description: parsed.map((entry) => entry.line).join('\n'),
        duration: Math.min(14_000, 4000 + parsed.length * 800),
    });
}

/** Jembatan error Inertia ke toast validasi; dipakai di callback onError useForm. */
function handleInertiaFormErrors(errors: TValidationErrors, ctx?: TErrorToastContext): void {
    showValidationErrorToast(errors, ctx);
}

/**
 * Tampilkan toast untuk status HTTP gagal, pesan body diprioritaskan di atas peta bawaan; dipakai di penangan error HTTP.
 * `body` sengaja `unknown` karena berasal dari respons HTTP eksternal dan disempitkan oleh `parseApiErrorMessage`.
 */
function showHttpErrorToast(status: number, body?: unknown, overrides?: Partial<Record<number, string>>): void {
    const defaults: Record<number, string> = {
        401: 'Anda perlu masuk terlebih dahulu.',
        403: 'Anda tidak memiliki izin untuk tindakan ini.',
        404: 'Data tidak ditemukan.',
        419: 'Sesi tidak valid atau sudah habis. Muat ulang halaman lalu coba lagi.',
        422: 'Data yang dikirim tidak valid. Periksa kembali formulir.',
        429: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
        500: 'Terjadi kesalahan server. Coba lagi nanti.',
        503: 'Layanan sedang sibuk. Coba lagi nanti.',
        ...overrides,
    };

    const fromBody = body ? parseApiErrorMessage(body, '') : '';
    if (fromBody) {
        toast.error(fromBody);
        return;
    }

    toast.error(defaults[status] ?? `Permintaan gagal (kode ${status}).`);
}

/** Tampilkan toast error generik dengan opsi judul/deskripsi/durasi; dipakai untuk pesan error non-validasi. */
function showErrorToast(message: string, options?: TErrorToastOptions): void {
    const text = humanizeErrorMessage(message);

    if (options?.title) {
        toast.error(options.title, {
            description: text || options.description,
            duration: options.duration,
        });
        return;
    }

    toast.error(text, {
        description: options?.description,
        duration: options?.duration,
    });
}

/** Tampilkan toast dari flash message session (sukses atau gagal); dipakai setelah redirect Inertia. */
function showFlashToast(flash: TFlashToastPayload): void {
    if (!flash?.message) return;

    const message = humanizeErrorMessage(flash.message);
    if (flash.type === 'success') {
        toast.success(message);
        return;
    }

    toast.error(message);
}

const errorToast: {
    showErrorToast: typeof showErrorToast;
    showFlashToast: typeof showFlashToast;
    showHttpErrorToast: typeof showHttpErrorToast;
    showValidationErrorToast: typeof showValidationErrorToast;
    handleInertiaFormErrors: typeof handleInertiaFormErrors;
} = {
    showErrorToast,
    showFlashToast,
    showHttpErrorToast,
    showValidationErrorToast,
    handleInertiaFormErrors,
};

/** Sediakan emitor toast error/flash; dipanggil di setup (.vue/hook) lalu dipakai di handler dan closure. */
export function useErrorToast(): typeof errorToast {
    return errorToast;
}
