<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsList, type TabsListProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
    <TabsList
        data-slot="tabs-list"
        :class="cn('inline-flex h-10 items-center justify-center rounded-xl border-2 border-foreground bg-white p-1 text-muted-foreground shadow-[4px_4px_0_var(--brutal-ink)]', props.class)"
        v-bind="{ ...props, class: undefined }"
    >
        <slot />
    </TabsList>
</template>
