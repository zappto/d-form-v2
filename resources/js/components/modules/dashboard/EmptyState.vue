<script setup lang="ts">
import { Vue3Lottie } from 'vue3-lottie'

defineProps<{
    title: string
    description?: string
    animationUrl?: string
    size?: number
}>()
</script>

<template>
    <div class="brutal-card brutal-noise flex flex-col items-center justify-center px-6 py-14 text-center">
        <Vue3Lottie
            v-if="animationUrl"
            :animation-link="animationUrl"
            :height="size ?? 180"
            :width="size ?? 180"
            :loop="true"
            class="mb-2 drop-shadow-[5px_5px_0_var(--brutal-ink)]"
        />
        <p class="font-display text-base font-extrabold text-foreground">{{ title }}</p>
        <p v-if="description" class="mt-2 max-w-xs text-sm font-medium text-muted-foreground">{{ description }}</p>
        <div class="mt-4">
            <slot />
        </div>
    </div>
</template>
