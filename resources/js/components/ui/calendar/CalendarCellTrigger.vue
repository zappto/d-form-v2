<script lang="ts" setup>
import type { CalendarCellTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CalendarCellTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes["class"] }>(), {
  as: "button",
})

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarCellTrigger
    data-slot="calendar-cell-trigger"
    :class="cn(
      buttonVariants({ variant: 'ghost', radius: 'full' }),
      'mx-auto size-8 p-0 font-normal aria-selected:opacity-100 cursor-default transition-colors duration-100',
      // Today: outline ring halus (tidak bentrok dengan selected)
      '[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-primary/40 [&[data-today]:not([data-selected])]:text-primary',
      // Hover (non-selected)
      'hover:bg-accent hover:text-accent-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground',
      // Selected: primary penuh bulat
      'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:opacity-100 data-[selected]:shadow-sm',
      // Disabled
      'data-[disabled]:text-muted-foreground data-[disabled]:opacity-40',
      // Unavailable
      'data-[unavailable]:text-destructive data-[unavailable]:line-through',
      // Outside months
      'data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-60',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarCellTrigger>
</template>
