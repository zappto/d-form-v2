<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@/lib/utils';

const props = defineProps<{
    defaultValue?: string | number;
    modelValue?: string | number;
    class?: HTMLAttributes['class'];
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
    passive: false,
    defaultValue: props.defaultValue,
});
</script>

<template>
    <input
        v-model="modelValue"
        data-slot="input"
        :class="
            cn(
                'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-10 w-full min-w-0 rounded-xl border-2 bg-white px-3 py-1 text-sm font-semibold shadow-[3px_3px_0_var(--brutal-ink)] transition-[color,box-shadow,transform] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'focus-visible:border-ring focus-visible:ring-ring/50 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--brutal-ink)] focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-[3px] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_var(--brutal-ink)]',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                props.class
            )
        "
    />
</template>
