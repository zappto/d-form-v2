<script setup lang="ts">
import { SelectRoot, type SelectRootProps } from 'reka-ui'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
    <SelectRoot v-bind="props" @update:model-value="(v) => emits('update:modelValue', v as string)">
        <slot />
    </SelectRoot>
</template>
