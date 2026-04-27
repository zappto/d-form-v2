<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Loader2Icon } from "lucide-vue-next"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <Loader2Icon
    role="status"
    aria-label="Loading"
    :class="cn('size-4 animate-spin rounded-full stroke-[3] text-current drop-shadow-[2px_2px_0_var(--brutal-ink)]', props.class)"
  />
</template>
