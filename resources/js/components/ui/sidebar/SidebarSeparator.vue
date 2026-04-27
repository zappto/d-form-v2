<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <Separator
        data-slot="sidebar-separator"
        data-sidebar="separator"
        :class="cn('sidebar-divider mx-2 my-4', props.class)"
    >
        <slot />
    </Separator>
</template>
