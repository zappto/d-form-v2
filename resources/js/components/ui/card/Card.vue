<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border-2 border-foreground py-6 shadow-[6px_6px_0_var(--brutal-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--brutal-ink)]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
