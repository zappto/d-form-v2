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
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
        <Vue3Lottie
            v-if="animationUrl"
            :animation-link="animationUrl"
            :height="size ?? 180"
            :width="size ?? 180"
            :loop="true"
            class="mb-2"
        />
        <p class="text-sm font-medium text-foreground">{{ title }}</p>
        <p v-if="description" class="mt-1 max-w-xs text-xs text-muted-foreground">{{ description }}</p>
        <div class="mt-4">
            <slot />
        </div>
    </div>
</template>
