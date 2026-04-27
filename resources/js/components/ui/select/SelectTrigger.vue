<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectTrigger, type SelectTriggerProps } from 'reka-ui'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
    <SelectTrigger
        data-slot="select-trigger"
        v-bind="{ ...props, class: undefined }"
        :class="cn('flex h-10 w-full items-center justify-between whitespace-nowrap rounded-xl border-2 border-input bg-white px-3 py-2 text-sm font-extrabold shadow-[3px_3px_0_var(--brutal-ink)] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1', props.class)"
    >
        <slot />
        <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectTrigger>
</template>
