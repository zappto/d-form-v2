<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsTrigger, type TabsTriggerProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
    <TabsTrigger
        data-slot="tabs-trigger"
        :class="cn('inline-flex items-center justify-center whitespace-nowrap rounded-lg border-2 border-transparent px-3 py-1 text-sm font-extrabold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-foreground data-[state=active]:bg-(--brutal-yellow) data-[state=active]:text-foreground data-[state=active]:shadow-[2px_2px_0_var(--brutal-ink)]', props.class)"
        v-bind="{ ...props, class: undefined }"
    >
        <slot />
    </TabsTrigger>
</template>
