<script setup lang="ts">
import { computed } from 'vue';
import { BannerPickerField } from '@/components/core/field';
import type { TFormBannerState } from './formBanner';
import { normalizeBannerSrc } from './formBanner';

const banner = defineModel<TFormBannerState>('banner', { required: true });

/** `frame` = kartu mandiri (border + shadow sendiri); `plain` = panel di dalam section induk */
const props = withDefaults(
    defineProps<{
        variant?: 'frame' | 'plain';
        bannerPreviewSrc?: string;
    }>(),
    {
        variant: 'frame',
        bannerPreviewSrc: '',
    }
);

/** Penawar chrome kartu picker saat `plain`, agar kanvas tetap rata seperti tampilan sebelumnya. */
const PLAIN_CHROME_RESET = 'rounded-none! border-0! bg-transparent! shadow-none!';

/** Pratinjau tersimpan dengan prioritas lama: `bannerPreviewUrl` → prop → path URL ternormalisasi. */
const storedPreviewUrl = computed<string>(() => {
    const pending = (banner.value.bannerPreviewUrl ?? '').trim();
    if (pending !== '') return pending;
    if (props.bannerPreviewSrc !== '') return props.bannerPreviewSrc;
    return normalizeBannerSrc(banner.value.bannerUrl);
});

/** Berkas pending yang ditampilkan picker; null saat tidak ada berkas baru menunggu diunggah. */
const pendingFile = computed<File | null>(() => banner.value.bannerFile ?? null);

/** Tulis berkas pilihan picker ke state builder segera, agar autosave menandainya pending. */
function onPickedFile(pick: File | null): void {
    if (pick === null) return;
    banner.value.bannerPreviewUrl = '';
    banner.value.bannerFileName = pick.name;
    banner.value.bannerFile = pick;
}

/** Kosongkan seluruh state banner: berkas pending maupun banner tersimpan (aksi Hapus). */
function clearBanner(): void {
    banner.value.bannerPreviewUrl = '';
    banner.value.bannerFileName = '';
    banner.value.bannerFile = null;
    banner.value.bannerUrl = '';
}
</script>

<template>
    <BannerPickerField
        :file="pendingFile"
        variant="frame"
        :initial-url="storedPreviewUrl"
        :class="variant === 'plain' ? PLAIN_CHROME_RESET : ''"
        @update:file="onPickedFile"
        @remove="clearBanner"
    />
</template>
