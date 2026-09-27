<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ImageOff } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { normalizeBannerSrc } from '@/lib/bannerSrc';

const props = withDefaults(
    defineProps<{
        src?: string | null;
        alt: string;
        imgClass?: string;
    }>(),
    { src: '', imgClass: '' }
);

const failed = ref(false);

function onError() {
    failed.value = true;
}

watch(
    () => props.src,
    () => {
        failed.value = false;
    }
);

const showImg = computed(() => Boolean(props.src) && !failed.value);

const resolvedSrc = computed(() => (props.src ? normalizeBannerSrc(props.src) : ''));
</script>

<template>
    <div class="relative size-full overflow-hidden bg-muted">
        <img
            v-if="showImg"
            :src="resolvedSrc"
            :alt="props.alt"
            loading="lazy"
            decoding="async"
            :class="cn('absolute inset-0 size-full object-cover', props.imgClass)"
            @error="onError"
        />
        <div
            v-else
            class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center text-muted-foreground"
        >
            <ImageOff class="size-6 shrink-0 opacity-50" :stroke-width="1.8" aria-hidden="true" />
            <span class="text-[10px] leading-tight font-medium">No banner</span>
        </div>
    </div>
</template>
