<script setup lang="ts">
import { SimpleSelect, type SimpleSelectOption } from '@/components/ui/simple-select';

const category = defineModel<string>('category', { default: 'all' });
const session = defineModel<string>('session', { default: 'all' });

defineProps<{
    categoryOptions: SimpleSelectOption[];
    sessionOptions: SimpleSelectOption[];
}>();
</script>

<template>
    <div class="flex flex-wrap items-end gap-3">
        <div class="flex min-w-0 flex-col gap-1.5">
            <SimpleSelect
                v-model="category"
                :options="categoryOptions"
                id="filter-kategori"
                class="border-border/80 bg-background/80 h-10 w-full rounded-xl text-xs sm:text-sm"
                aria-label="Filter kategori"
            />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
            <SimpleSelect
                v-model="session"
                :options="sessionOptions"
                id="filter-sesi"
                class="border-border/80 bg-background/80 h-10 w-full rounded-xl text-xs sm:text-sm"
                aria-label="Filter sesi"
            />
        </div>
    </div>
</template>
