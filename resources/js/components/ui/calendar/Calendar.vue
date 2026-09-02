<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps, DateValue } from "reka-ui"
import type { HTMLAttributes, Ref } from "vue"
import type { LayoutTypes } from "."
import { getLocalTimeZone, today } from "@internationalized/date"
import { createReusableTemplate, reactiveOmit, useVModel } from "@vueuse/core"
import { CalendarRoot, useDateFormatter, useForwardPropsEmits } from "reka-ui"
import { createYear, createYearRange, toDate } from "reka-ui/date"
import { ChevronDown } from "lucide-vue-next"
import { computed, ref, toRaw } from "vue"
import { cn } from "@/lib/utils"
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNextButton, CalendarPrevButton } from "."

const props = withDefaults(defineProps<CalendarRootProps & { class?: HTMLAttributes["class"], layout?: LayoutTypes, yearRange?: DateValue[] }>(), {
  modelValue: undefined,
  layout: undefined,
})
const emits = defineEmits<CalendarRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "layout", "placeholder")

const placeholder = useVModel(props, "placeholder", emits, {
  passive: true,
  defaultValue: props.defaultPlaceholder ?? today(getLocalTimeZone()),
}) as Ref<DateValue>

const formatter = useDateFormatter(props.locale ?? "en")

const yearRange = computed(() => {
  return props.yearRange ?? createYearRange({
    start: props?.minValue ?? (toRaw(props.placeholder) ?? props.defaultPlaceholder ?? today(getLocalTimeZone()))
      .cycle("year", -100),

    end: props?.maxValue ?? (toRaw(props.placeholder) ?? props.defaultPlaceholder ?? today(getLocalTimeZone()))
      .cycle("year", 10),
  })
})

const [DefineMonthTemplate, ReuseMonthTemplate] = createReusableTemplate<{ date: DateValue }>()
const [DefineYearTemplate, ReuseYearTemplate] = createReusableTemplate<{ date: DateValue }>()

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// ── Dropdown bulan/tahun modern (menggantikan native select transparan) ──
const openDropdown = ref<'month' | 'year' | null>(null)

function monthShort(date: DateValue): string {
  return formatter.custom(toDate(date), { month: 'short' })
}
function monthLong(date: DateValue): string {
  return formatter.custom(toDate(date), { month: 'long' })
}
function yearNum(date: DateValue): string {
  return formatter.custom(toDate(date), { year: 'numeric' })
}
</script>

<template>
  <DefineMonthTemplate v-slot="{ date }">
    <div class="relative">
      <button
        type="button"
        class="flex h-8 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
        @click="openDropdown = openDropdown === 'month' ? null : 'month'"
      >
        {{ monthLong(date) }}
        <ChevronDown class="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>
      <div
        v-if="openDropdown === 'month'"
        class="absolute left-0 top-full z-50 mt-1 max-h-56 w-36 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-sm"
      >
        <button
          v-for="m in createYear({ dateObj: date })"
          :key="m.toString()"
          type="button"
          class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-100 hover:bg-accent"
          :class="m.month === date.month ? 'bg-accent font-semibold text-foreground' : 'text-muted-foreground'"
          @click="placeholder = placeholder.set({ month: m.month }); openDropdown = null"
        >
          {{ monthShort(m) }}
        </button>
      </div>
    </div>
  </DefineMonthTemplate>

  <DefineYearTemplate v-slot="{ date }">
    <div class="relative">
      <button
        type="button"
        class="flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
        @click="openDropdown = openDropdown === 'year' ? null : 'year'"
      >
        {{ yearNum(date) }}
        <ChevronDown class="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>
      <div
        v-if="openDropdown === 'year'"
        class="absolute right-0 top-full z-50 mt-1 max-h-56 w-24 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-sm"
      >
        <button
          v-for="y in yearRange"
          :key="y.toString()"
          type="button"
          class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-100 hover:bg-accent"
          :class="y.year === date.year ? 'bg-accent font-semibold text-foreground' : 'text-muted-foreground'"
          @click="placeholder = placeholder.set({ year: y.year }); openDropdown = null"
        >
          {{ yearNum(y) }}
        </button>
      </div>
    </div>
  </DefineYearTemplate>

  <CalendarRoot
    v-slot="{ grid, weekDays, date }"
    v-bind="forwarded"
    v-model:placeholder="placeholder"
    data-slot="calendar"
    :class="cn('p-3', props.class)"
  >
    <CalendarHeader class="pt-0">
      <nav class="absolute inset-x-0 top-0 flex items-center justify-between">
        <CalendarPrevButton>
          <slot name="calendar-prev-icon" />
        </CalendarPrevButton>
        <CalendarNextButton>
          <slot name="calendar-next-icon" />
        </CalendarNextButton>
      </nav>

      <slot name="calendar-heading" :date="date" :month="ReuseMonthTemplate" :year="ReuseYearTemplate">
        <template v-if="layout === 'month-and-year'">
          <div class="flex items-center justify-center gap-1">
            <ReuseMonthTemplate :date="date" />
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else-if="layout === 'month-only'">
          <div class="flex items-center justify-center gap-1">
            <ReuseMonthTemplate :date="date" />
            {{ yearNum(date) }}
          </div>
        </template>
        <template v-else-if="layout === 'year-only'">
          <div class="flex items-center justify-center gap-1">
            {{ monthShort(date) }}
            <ReuseYearTemplate :date="date" />
          </div>
        </template>
        <template v-else>
          <CalendarHeading />
        </template>
      </slot>
    </CalendarHeader>

    <div class="mt-4 flex flex-col gap-y-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell
              v-for="day in weekDays" :key="day"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="mt-2 w-full">
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
