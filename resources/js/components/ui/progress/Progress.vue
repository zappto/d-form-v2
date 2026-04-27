<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; modelValue?: number; max?: number }>()
</script>

<template>
    <div data-slot="progress" :class="cn('relative h-4 w-full overflow-hidden rounded-full border-2 border-foreground bg-white shadow-[3px_3px_0_var(--brutal-ink)]', props.class)">
        <div
            class="h-full w-full flex-1 bg-[var(--brutal-mint)] transition-all"
            :style="{ transform: `translateX(-${100 - (Math.min(modelValue ?? 0, max ?? 100) / (max ?? 100)) * 100}%)` }"
        />
    </div>
</template>
