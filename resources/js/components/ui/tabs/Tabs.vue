<script setup lang="ts">
import { TabsRoot, type TabsRootProps } from 'reka-ui'

const props = defineProps<TabsRootProps>()
const emits = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
    <TabsRoot v-bind="props" @update:model-value="(v) => emits('update:modelValue', v as string)">
        <slot />
    </TabsRoot>
</template>
