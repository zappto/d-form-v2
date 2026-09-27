<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { ImageUp, RefreshCw, X } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { useBannerFilePicker } from '@/hooks/useBannerFilePicker';

/** Tipe MIME yang diterima picker banner; selaras batas backend `banner_file`. */
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
/** Batas ukuran banner; backend memakai `banner_file max:5120` (KB). */
const MAX_BANNER_BYTES = 5 * 1024 * 1024;
/** Copy galat yang sama dengan implementasi banner sebelumnya. */
const TYPE_ERROR = 'Gunakan PNG, JPG, JPEG, atau GIF.';
const SIZE_ERROR = 'Ukuran banner maksimal 5 MB.';
const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/gif';

/** Berkas terpilih sumber upload multipart; null saat kosong atau setelah Hapus. */
const file = defineModel<File | null>('file', { default: null });

const props = withDefaults(
    defineProps<{
        /** URL/path banner tersimpan; jadi pratinjau selama belum ada berkas baru. */
        initialUrl?: string | null;
        /** `frame` = kartu mandiri; `plain` = kotak di dalam section konsumen. */
        variant?: 'frame' | 'plain';
        /** Tandai bidang tidak valid (mis. `!!form.errors.banner`). */
        invalid?: boolean;
        /** Pesan galat konsumen; ditampilkan bila tidak ada galat lokal. */
        error?: string;
        /** Id input berkas, dipakai `Label for` konsumen. */
        id?: string;
        /** Daftar MIME yang boleh dipilih dialog berkas. */
        accept?: string;
    }>(),
    {
        initialUrl: null,
        variant: 'frame',
        invalid: false,
        error: '',
        id: 'banner',
        accept: DEFAULT_ACCEPT,
    }
);

const picker = useBannerFilePicker({ initialUrl: props.initialUrl });
const isDragging = picker.isDragging;
const fileInput = ref<HTMLInputElement | null>(null);
const localError = ref('');

const previewSrc = computed<string>(() => picker.bannerPreview.value ?? '');
const hasImage = computed<boolean>(() => previewSrc.value !== '');
const isNewFile = computed<boolean>(() => picker.bannerFile.value !== null);
const fileName = computed<string>(() => picker.bannerFile.value?.name ?? '');
const message = computed<string>(() => localError.value || props.error);
const isFrame = computed<boolean>(() => props.variant === 'frame');

const frameClass = computed<string>(() =>
    cn(
        'border-border bg-card overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-200',
        isDragging.value && 'border-primary/60 ring-primary/15 ring-2',
        props.invalid && 'border-destructive/70 bg-red-50 dark:bg-red-500/10'
    )
);

const dropZoneClass = computed<string>(() =>
    cn(
        'border-border bg-muted/25 overflow-hidden rounded-xl border-2 transition-colors',
        isDragging.value && 'border-primary/60 bg-primary/5',
        props.invalid && 'border-destructive/70 bg-red-50 dark:bg-red-500/10'
    )
);

// Hook hanya membaca initialUrl saat setup; ikuti prop saat berubah selama belum
// ada berkas baru, agar halaman edit menampilkan banner tersimpan begitu dimuat.
watch(
    (): string | null => props.initialUrl,
    (url: string | null): void => {
        if (picker.bannerFile.value === null) picker.bannerPreview.value = url;
    }
);

/** Kembalikan pesan galat untuk berkas banner, atau null bila lolos validasi. */
function validationError(candidate: File): string | null {
    if (!ALLOWED_TYPES.includes(candidate.type)) return TYPE_ERROR;
    if (candidate.size > MAX_BANNER_BYTES) return SIZE_ERROR;
    return null;
}

/** Validasi lalu jadikan berkas sebagai pratinjau baru; galat tidak mengubah pratinjau. */
function applyPickedFile(candidate: File | null | undefined): void {
    localError.value = '';
    if (!candidate) return;
    const failure = validationError(candidate);
    if (failure !== null) {
        localError.value = failure;
        return;
    }
    picker.applyFile(candidate);
    file.value = candidate;
}

/** Buang pilihan baru; pratinjau kembali ke URL tersimpan dan emit `null`. */
function removeFile(): void {
    picker.clearSelection();
    picker.bannerPreview.value = props.initialUrl;
    localError.value = '';
    file.value = null;
}

/** Buka dialog pilih berkas browser. */
function openPicker(): void {
    picker.openPicker(fileInput.value);
}

/** Ambil berkas dari input; input dikosongkan agar berkas sama bisa dipilih ulang. */
function onInputChange(): void {
    if (fileInput.value === null) return;
    applyPickedFile(fileInput.value.files?.[0]);
    fileInput.value.value = '';
}

/** Terima drop gambar; status seret reda dan berkas tak diizinkan ditolak dengan copy galat. */
function onDrop(event: DragEvent): void {
    picker.isDragging.value = false;
    applyPickedFile(event.dataTransfer?.files?.[0]);
}
</script>

<template>
    <div :class="isFrame ? frameClass : ''">
        <template v-if="isFrame">
            <!-- frame: belum ada banner → area unggah -->
            <button
                v-if="!hasImage"
                type="button"
                class="group hover:bg-muted/25 flex w-full cursor-pointer items-center gap-3 px-5 py-6 text-left transition-colors duration-200 sm:px-7"
                :aria-invalid="invalid || undefined"
                @click="openPicker"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
            >
                <span
                    class="bg-muted text-muted-foreground group-hover:border-primary/40 group-hover:text-primary border-border/70 grid size-10 shrink-0 place-items-center rounded-xl border shadow-xs transition-[color,border-color] duration-200"
                >
                    <ImageUp class="size-5" aria-hidden="true" />
                </span>
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span class="text-foreground text-sm font-semibold">Tambahkan banner form</span>
                    <span class="text-muted-foreground text-xs leading-snug">
                        Gambar sampul di bagian atas form — rasio 3:1
                    </span>
                </span>
                <span
                    class="border-border bg-background text-muted-foreground/80 rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:hidden"
                >
                    PNG · JPG · GIF
                </span>
                <span
                    class="text-muted-foreground hidden shrink-0 text-[10px] font-semibold tracking-wide uppercase sm:block"
                >
                    Klik atau seret
                </span>
            </button>
            <!-- frame: banner tampil → pratinjau + aksi -->
            <div v-else>
                <div class="relative aspect-[3/1] w-full overflow-hidden">
                    <img :src="previewSrc" alt="Pratinjau banner" class="size-full object-cover" />
                </div>
                <div
                    class="border-border/70 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t px-5 py-2.5 sm:px-7"
                >
                    <div class="flex min-w-0 items-center gap-2">
                        <span class="text-muted-foreground truncate text-xs font-medium">
                            {{ fileName || 'banner-form' }}
                        </span>
                        <span
                            v-if="isNewFile"
                            class="border-primary/20 bg-primary/8 text-primary shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
                        >
                            baru
                        </span>
                    </div>
                    <div class="flex shrink-0 items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            class="h-8 gap-1.5 text-xs"
                            @click="openPicker"
                        >
                            <RefreshCw class="size-3.5" aria-hidden="true" />
                            Ganti
                        </Button>
                        <Button
                            radius="icon"
                            variant="ghost"
                            size="icon-sm"
                            type="button"
                            class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Hapus banner"
                            @click="removeFile"
                        >
                            <X class="size-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>
            <p
                v-if="message"
                class="bg-destructive/5 text-destructive border-border/70 border-t px-5 py-2 text-xs font-medium sm:px-7"
            >
                {{ message }}
            </p>
        </template>

        <template v-else>
            <div v-if="hasImage" class="mb-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" class="h-9 text-xs" @click="openPicker">Ganti</Button>
                <Button
                    type="button"
                    radius="icon"
                    variant="ghost"
                    size="icon-sm"
                    class="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Hapus banner"
                    @click="removeFile"
                >
                    <X class="size-4" aria-hidden="true" />
                </Button>
            </div>
            <div :class="dropZoneClass">
                <div class="relative aspect-video w-full">
                    <img
                        v-if="hasImage"
                        :src="previewSrc"
                        alt="Pratinjau banner"
                        class="absolute inset-0 size-full object-cover"
                    />
                    <div
                        v-else
                        class="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2.5 px-6 text-center transition-colors"
                        :aria-invalid="invalid || undefined"
                        @dragover.prevent="isDragging = true"
                        @dragleave="isDragging = false"
                        @drop.prevent="onDrop"
                        @click="openPicker"
                    >
                        <span class="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
                            <ImageUp class="size-5.5 stroke-[1.75]" aria-hidden="true" />
                        </span>
                        <div>
                            <p class="text-sm font-medium">Unggah banner</p>
                            <p class="text-muted-foreground mt-0.5 text-xs">
                                Klik untuk memilih, atau seret gambar ke sini
                            </p>
                        </div>
                    </div>
                    <div
                        v-if="hasImage && isNewFile"
                        class="bg-background/85 absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full px-2 py-1 shadow-sm backdrop-blur-sm"
                    >
                        <span class="text-foreground max-w-[12rem] truncate text-[11px] font-medium">{{
                            fileName
                        }}</span>
                        <span
                            class="border-primary/20 bg-primary/8 text-primary shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
                        >
                            baru
                        </span>
                    </div>
                </div>
            </div>
            <p v-if="message" class="text-destructive mt-2 text-xs">{{ message }}</p>
        </template>

        <input
            :id="id"
            ref="fileInput"
            type="file"
            :accept="accept"
            class="hidden"
            :aria-invalid="invalid || undefined"
            @change="onInputChange"
        />
    </div>
</template>
