<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { ChevronRight } from 'lucide-vue-next';
import type { IBreadcrumbItem } from '@/lib/breadcrumbs';

defineProps<{
    items: IBreadcrumbItem[];
}>();
</script>

<template>
    <div
        class="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground sm:text-[13px]"
        aria-label="Breadcrumb"
    >
        <template v-for="(item, idx) in items" :key="`${item.label}-${idx}`">
            <ChevronRight
                v-if="idx > 0"
                class="size-3 shrink-0 stroke-[1.75] text-muted-foreground/60"
                aria-hidden="true"
            />
            <Link
                v-if="idx < items.length - 1"
                :href="item.href"
                class="min-w-0 truncate transition-colors duration-150 hover:text-foreground"
            >
                {{ item.label }}
            </Link>
            <span v-else class="min-w-0 truncate font-medium text-foreground">
                {{ item.label }}
            </span>
        </template>
    </div>
</template>
