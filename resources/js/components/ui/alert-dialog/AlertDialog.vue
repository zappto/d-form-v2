<script setup lang="ts">
import { AlertDialogRoot } from 'reka-ui'

// Avoid importing AlertDialogRootProps: Vue SFC compiler cannot resolve it from reka-ui for runtime props.
const props = defineProps<{
    open?: boolean
    defaultOpen?: boolean
    modal?: boolean
}>()
</script>
<template><AlertDialogRoot v-bind="props"><slot /></AlertDialogRoot></template>
