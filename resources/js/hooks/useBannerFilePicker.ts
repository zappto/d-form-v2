import { ref, type Ref } from 'vue';
import { useObjectUrl } from './useObjectUrl';

/** Argumen useBannerFilePicker: URL tersimpan untuk preview awal dan reset clear. */
export interface IBannerFilePickerArgs {
    initialUrl: string | null;
}

/** Hasil useBannerFilePicker: preview, berkas, drag, dan handler input/drop. */
export interface IBannerFilePickerResult {
    bannerPreview: Ref<string | null>;
    bannerFile: Ref<File | null>;
    isDragging: Ref<boolean>;
    openPicker: (input: HTMLInputElement | null) => void;
    applyFile: (file: File) => void;
    handleInputChange: (event: Event) => void;
    handleDrop: (event: DragEvent) => void;
    clearSelection: () => void;
}

/** True bila berkas adalah gambar; drop non-gambar diabaikan seperti call-site lama. */
function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/** Ambil elemen input dari event; null bila event bukan dari input file. */
function asFileInput(target: EventTarget | null): HTMLInputElement | null {
    if (target instanceof HTMLInputElement) return target;
    return null;
}

/** Ambil berkas gambar pertama dari drop; null bila kosong atau bukan gambar. */
function extractDroppedFile(event: DragEvent): File | null {
    const file: File | undefined = event.dataTransfer?.files?.[0];
    if (file === undefined) return null;
    return isImageFile(file) ? file : null;
}

/** Picker banner: preview object URL diutamakan, revoke aman via useObjectUrl. */
export function useBannerFilePicker(args: IBannerFilePickerArgs): IBannerFilePickerResult {
    const objectUrl = useObjectUrl();
    const bannerFile: Ref<File | null> = ref(null);
    const bannerPreview: Ref<string | null> = ref(args.initialUrl);
    const isDragging: Ref<boolean> = ref(false);

    /** Buka dialog pilih berkas; dipakai tombol Ganti/Unggah. */
    function openPicker(input: HTMLInputElement | null): void {
        input?.click();
    }

    /** Terapkan berkas baru sebagai preview object URL plus pegang File-nya. */
    function applyFile(file: File): void {
        bannerPreview.value = objectUrl.createFromFile(file);
        bannerFile.value = file;
    }

    /** Tangani change input file; kosongkan input agar berkas sama bisa dipilih ulang. */
    function handleInputChange(event: Event): void {
        const input: HTMLInputElement | null = asFileInput(event.target);
        const file: File | null = input?.files?.[0] ?? null;
        if (file !== null) applyFile(file);
        if (input !== null) input.value = '';
    }

    /** Tangani drop gambar; non-gambar diabaikan dan status seret selalu reda. */
    function handleDrop(event: DragEvent): void {
        isDragging.value = false;
        const file: File | null = extractDroppedFile(event);
        if (file !== null) applyFile(file);
    }

    /** Batalkan pilihan baru; preview kembali ke URL tersimpan awal. */
    function clearSelection(): void {
        objectUrl.clear();
        bannerFile.value = null;
        bannerPreview.value = args.initialUrl;
    }

    return { bannerPreview, bannerFile, isDragging, openPicker, applyFile, handleInputChange, handleDrop, clearSelection };
}
