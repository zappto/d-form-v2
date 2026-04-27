<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="cn('border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-xl border-2 bg-white px-3 py-2 text-sm font-semibold shadow-[3px_3px_0_var(--brutal-ink)] transition-[color,box-shadow,transform] outline-none focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', props.class)"
  />
</template>
