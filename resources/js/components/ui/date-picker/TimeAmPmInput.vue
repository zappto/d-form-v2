<script setup lang="ts">
import { computed } from 'vue'

/**
 * Input jam 12-jam + AM/PM. Nilai keluar TETAP `HH:mm` 24-jam
 * (backend & payload tidak berubah). Konversi otomatis saat ubah.
 */
const props = withDefaults(
    defineProps<{
        /** Nilai 24-jam `HH:mm` (payload asli). */
        modelValue: string
        class?: string
        id?: string
        /** True saat field punya error validasi: border merah + bg tint di semua segmen. */
        ariaInvalid?: boolean
    }>(),
    { class: '', ariaInvalid: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rootClass = computed(() => props.class)

const invalidSegClass =
    'border-destructive/70 bg-red-50 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-red-500/10 dark:focus-visible:border-destructive/70'

/** Parse "HH:mm" (24h) → { h12: 1-12, meridian: 'AM'|'PM', minute: '00' } */
/** Parse "HH:mm" (24h) → { h12: 1-12, meridian: 'AM'|'PM', minute: '00' } */
function to12h(value: string): { h12: number; meridian: 'AM' | 'PM'; minute: string } {
    const [hhRaw, mmRaw = '00'] = value.split(':')
    let h = parseInt(hhRaw, 10)
    if (!Number.isFinite(h)) h = 0
    const minute = mmRaw.length >= 2 ? mmRaw.slice(0, 2) : '00'
    const meridian: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
    let h12 = h % 12
    if (h12 === 0) h12 = 12
    return { h12, meridian, minute }
}

/** "1-12" + meridian → "HH:mm" 24-jam */
function to24h(h12: number, meridian: 'AM' | 'PM', minute: string): string {
    let h = h12 % 12
    if (meridian === 'PM') h += 12
    const hh = String(h).padStart(2, '0')
    const mm = (minute || '00').slice(0, 2).padStart(2, '0')
    return `${hh}:${mm}`
}

const state = computed(() => to12h(props.modelValue))
const hourInput = computed(() => String(state.value.h12))
const meridian = computed(() => state.value.meridian)
const minute = computed(() => state.value.minute)

function onHourInput(v: string): void {
    const digits = v.replace(/\D/g, '').slice(0, 2)
    let h = parseInt(digits, 10)
    if (!Number.isFinite(h) || h < 1) h = 1
    if (h > 12) h = 12
    emit('update:modelValue', to24h(h, meridian.value, minute.value))
}

function onMinuteInput(v: string): void {
    const digits = v.replace(/\D/g, '').slice(0, 2)
    let m = parseInt(digits, 10)
    if (!Number.isFinite(m)) m = 0
    if (m > 59) m = 59
    emit('update:modelValue', to24h(state.value.h12, meridian.value, String(m).padStart(2, '0')))
}

function onMinuteBlur(): void {
    const digits = minute.value.replace(/\D/g, '').slice(0, 2)
    let mm = parseInt(digits, 10)
    if (!Number.isFinite(mm)) mm = 0
    if (mm > 59) mm = 59
    emit('update:modelValue', to24h(state.value.h12, meridian.value, String(mm).padStart(2, '0')))
}

function setMeridian(m: 'AM' | 'PM'): void {
    emit('update:modelValue', to24h(state.value.h12, m, minute.value))
}
</script>

<template>
    <div :class="['flex items-stretch gap-1', rootClass]">
        <!-- Jam -->
        <div class="relative">
            <input
                :id="id"
                type="text"
                inputmode="numeric"
                :value="hourInput"
                :aria-invalid="ariaInvalid === true ? true : undefined"
                :class="[
                    'bg-white border-input focus-visible:border-ring focus-visible:ring-ring/30 h-9 w-12 rounded-lg border text-center text-sm font-medium tabular-nums shadow-xs outline-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-[3px]',
                    ariaInvalid ? invalidSegClass : '',
                ]"
                aria-label="Jam"
                @input="onHourInput(($event.target as HTMLInputElement).value)"
            />
        </div>
        <span class="text-muted-foreground flex items-center text-sm font-medium">:</span>
        <!-- Menit -->
        <div class="relative">
            <input
                type="text"
                inputmode="numeric"
                :value="minute"
                :aria-invalid="ariaInvalid === true ? true : undefined"
                :class="[
                    'bg-white border-input focus-visible:border-ring focus-visible:ring-ring/30 h-9 w-12 rounded-lg border text-center text-sm font-medium tabular-nums shadow-xs outline-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-[3px]',
                    ariaInvalid ? invalidSegClass : '',
                ]"
                aria-label="Menit"
                @input="onMinuteInput(($event.target as HTMLInputElement).value)"
                @blur="onMinuteBlur"
            />
        </div>
        <!-- AM/PM segmented -->
        <div
            :class="[
                'bg-muted/60 flex h-9 items-center gap-0.5 rounded-lg border border-border p-0.5',
                ariaInvalid ? 'border-destructive/70 bg-red-50 dark:bg-red-500/10' : '',
            ]"
        >
            <button
                type="button"
                class="h-full min-w-9 rounded-md px-1.5 text-xs font-semibold transition-colors duration-100"
                :class="meridian === 'AM' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                @click="setMeridian('AM')"
            >
                AM
            </button>
            <button
                type="button"
                class="h-full min-w-9 rounded-md px-1.5 text-xs font-semibold transition-colors duration-100"
                :class="meridian === 'PM' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                @click="setMeridian('PM')"
            >
                PM
            </button>
        </div>
    </div>
</template>
