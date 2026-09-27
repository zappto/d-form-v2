<script setup lang="ts">
import SearchableSelect, { type SearchableSelectOption } from '@/components/core/SearchableSelect.vue';

const category = defineModel<string>('category', { default: 'all' });
const session = defineModel<string>('session', { default: 'all' });

defineProps<{
    categoryOptions: SearchableSelectOption[];
    sessionOptions: SearchableSelectOption[];
}>();
</script>

<template>
    <div class="flex flex-wrap items-end gap-3">
        <div class="flex min-w-0 flex-col gap-1.5">
            <SearchableSelect
                v-model="category"
                :options="categoryOptions"
                id="filter-kategori"
                class="h-10 w-full border-border/80 bg-background/80 text-xs sm:text-sm"
                aria-label="Filter kategori"
            />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
            <SearchableSelect
                v-model="session"
                :options="sessionOptions"
                id="filter-sesi"
                class="h-10 w-full border-border/80 bg-background/80 text-xs sm:text-sm"
                aria-label="Filter sesi"
            />
        </div>
    </div>
</template>
