<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next"
import { Toaster as Sonner } from "vue-sonner"
import { cn } from "@/lib/utils"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster group brutal-toaster', props.class)"
    :style="{
      '--width': 'min(100vw - 2rem, 22rem)',
      '--normal-bg': 'var(--card)',
      '--normal-text': 'var(--brutal-ink)',
      '--normal-border': 'var(--brutal-ink)',
      '--border-radius': '0.75rem',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4 text-[var(--brutal-mint)]" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4 text-[var(--brutal-blue)]" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4 text-[var(--brutal-yellow)]" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4 text-destructive" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin text-[var(--brutal-ink)]" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
/* Match semi-brutal UI: ink frame + small offset shadow (see resources/css/app.css tokens). */
.brutal-toaster[data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
  border-width: 2px !important;
  border-color: var(--brutal-ink) !important;
  box-shadow: var(--brutal-shadow-sm) !important;
  font-weight: 700;
}

.brutal-toaster[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-title] {
  color: var(--brutal-ink) !important;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.brutal-toaster[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-description] {
  color: color-mix(in srgb, var(--brutal-ink) 55%, transparent) !important;
  font-weight: 600;
}

.brutal-toaster[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-close-button] {
  border: 2px solid color-mix(in srgb, var(--brutal-ink) 22%, transparent) !important;
  background: white !important;
  color: var(--brutal-ink) !important;
}

.brutal-toaster [data-rich-colors="true"][data-sonner-toast][data-type="success"][data-styled="true"] {
  background: color-mix(in srgb, var(--brutal-mint) 26%, white) !important;
  border-color: var(--brutal-ink) !important;
  color: var(--brutal-ink) !important;
}

.brutal-toaster [data-rich-colors="true"][data-sonner-toast][data-type="info"][data-styled="true"] {
  background: color-mix(in srgb, var(--brutal-blue) 18%, white) !important;
  border-color: var(--brutal-ink) !important;
  color: var(--brutal-ink) !important;
}

.brutal-toaster [data-rich-colors="true"][data-sonner-toast][data-type="warning"][data-styled="true"] {
  background: color-mix(in srgb, var(--brutal-yellow) 42%, white) !important;
  border-color: var(--brutal-ink) !important;
  color: var(--brutal-ink) !important;
}

.brutal-toaster [data-rich-colors="true"][data-sonner-toast][data-type="error"][data-styled="true"] {
  background: color-mix(in srgb, var(--destructive) 14%, white) !important;
  border-color: var(--brutal-ink) !important;
  color: var(--brutal-ink) !important;
}
</style>
