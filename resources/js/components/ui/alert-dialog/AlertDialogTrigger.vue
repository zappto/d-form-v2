<script setup lang="ts">
import { AlertDialogTrigger, type AlertDialogTriggerProps } from 'reka-ui'
const props = defineProps<AlertDialogTriggerProps>()
</script>
<template><AlertDialogTrigger v-bind="props" as-child><slot /></AlertDialogTrigger></template>
