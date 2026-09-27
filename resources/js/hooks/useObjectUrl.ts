import { onBeforeUnmount, ref, type Ref } from 'vue';

/** Prefix URL yang boleh direvoke; URL tersimpan (http/path/data) tidak disentuh. */
const BLOB_URL_PREFIX = 'blob:';

/** Hasil useObjectUrl: URL aktif plus pembuat dan pembersih berekonomi revoke. */
export interface IObjectUrlResult {
    currentUrl: Ref<string | null>;
    createFromFile: (file: Blob) => string;
    clear: () => void;
}

/** Revoke aman khusus blob:; non-blob dan revoke ganda diabaikan. */
function revokeSafely(url: string | null): void {
    if (url === null || !url.startsWith(BLOB_URL_PREFIX)) return;
    try {
        URL.revokeObjectURL(url);
    } catch {
        /* abaikan: revoke ganda tidak menggagalkan UI */
    }
}

/** Kelola satu object URL: buat baru, revoke saat ganti, clear, dan unmount. */
export function useObjectUrl(): IObjectUrlResult {
    const currentUrl: Ref<string | null> = ref(null);

    /** Buat URL preview baru; URL lama direvoke dulu agar tak bocor. */
    function createFromFile(file: Blob): string {
        revokeSafely(currentUrl.value);
        const freshUrl: string = URL.createObjectURL(file);
        currentUrl.value = freshUrl;
        return freshUrl;
    }

    /** Revoke URL aktif lalu kosongkan; aman dipanggil saat sudah kosong. */
    function clear(): void {
        revokeSafely(currentUrl.value);
        currentUrl.value = null;
    }

    onBeforeUnmount((): void => {
        revokeSafely(currentUrl.value);
        currentUrl.value = null;
    });

    return { currentUrl, createFromFile, clear };
}
