<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; modelValue?: number; max?: number }>()
</script>

<template>
    <div :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)">
        <div
            class="h-full w-full flex-1 bg-primary transition-all"
            :style="{ transform: `translateX(-${100 - (Math.min(modelValue ?? 0, max ?? 100) / (max ?? 100)) * 100}%)` }"
        />
    </div>
</template>
