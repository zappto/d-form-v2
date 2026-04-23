<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; href?: string }>()
</script>

<template>
    <a v-if="href" :href="href" :class="cn('transition-colors hover:text-foreground text-muted-foreground text-sm', props.class)">
        <slot />
    </a>
    <span v-else :class="cn('transition-colors hover:text-foreground text-muted-foreground text-sm', props.class)">
        <slot />
    </span>
</template>
