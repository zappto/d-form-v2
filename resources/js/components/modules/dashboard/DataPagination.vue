<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationFirst,
    PaginationItem,
    PaginationLast,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

/** Page navigator for the dashboard table patterns; owns only the nav element. */
interface IDataPaginationProps {
    /** Current 1-based page, forwarded to reka as `page`. */
    page: number;
    /** Row count; the numbered window derives from it with `perPage` (reka), so numbered call-sites need both. */
    total?: number;
    /** Rows per page; the numbered window derives from it with `total` (reka), so numbered call-sites need both. */
    perPage?: number;
    /** Authoritative page count (server `last_page`); falls back to ceil(total / perPage). */
    pageCount?: number;
    /** Page numbers kept on each side of the active page. */
    siblingCount?: number;
    /** Keeps the first/last page always visible, with ellipsis between them. */
    edges?: boolean;
    /** `true` renders numbered pages; `false` renders only prev/next. */
    numbers?: boolean;
    /** Adds icon-only First/Last buttons on both ends. */
    firstLast?: boolean;
    /** Label for the previous button. */
    prevLabel?: string;
    /** Label for the next button. */
    nextLabel?: string;
}

const props = withDefaults(defineProps<IDataPaginationProps>(), {
    total: 0,
    perPage: 1,
    siblingCount: 1,
    edges: false,
    numbers: true,
    firstLast: false,
    prevLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
});

const emits = defineEmits<{ 'update:page': [page: number] }>();

/** Total page count for a row count, never below one page; fallback for `pageCount`. */
function toPageCount(total: number, perPage: number): number {
    return Math.max(1, Math.ceil(total / (perPage || 1)));
}

const resolvedPageCount = computed<number>(() => props.pageCount ?? toPageCount(props.total, props.perPage));
const isFirstPage = computed(() => props.page <= 1);
const isLastPage = computed(() => props.page >= resolvedPageCount.value);
/** Widens the labelled buttons to match the `size-9` icon-only edge buttons. */
const labelButtonClass = computed(() => (props.firstLast ? 'h-9 px-4' : undefined));

/** Emits the page the call-site should navigate to. */
function emitPage(page: number): void {
    emits('update:page', page);
}
</script>

<template>
    <Pagination
        v-if="numbers"
        class="mx-0 w-auto"
        aria-label="Navigasi halaman"
        :page="page"
        :total="total"
        :items-per-page="perPage"
        :sibling-count="siblingCount"
        :show-edges="edges"
        @update:page="emitPage"
    >
        <PaginationContent v-slot="{ items }">
            <PaginationFirst v-if="firstLast" />
            <PaginationPrevious aria-label="Halaman sebelumnya">
                <ChevronLeft class="size-4" aria-hidden="true" />
                <span class="hidden sm:block">{{ prevLabel }}</span>
            </PaginationPrevious>
            <template v-for="(item, index) in items" :key="index">
                <PaginationItem
                    v-if="item.type === 'page'"
                    :value="item.value"
                    :is-active="item.value === page"
                    :aria-label="`Ke halaman ${item.value}`"
                >
                    {{ item.value }}
                </PaginationItem>
                <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext aria-label="Halaman berikutnya">
                <span class="hidden sm:block">{{ nextLabel }}</span>
                <ChevronRight class="size-4" aria-hidden="true" />
            </PaginationNext>
            <PaginationLast v-if="firstLast" />
        </PaginationContent>
    </Pagination>

    <template v-else>
        <Button
            v-if="firstLast"
            radius="icon"
            variant="outline"
            size="icon"
            class="size-9"
            :disabled="isFirstPage"
            aria-label="Halaman pertama"
            @click="emitPage(1)"
        >
            <ChevronsLeft class="size-4" />
        </Button>
        <Button
            variant="outline"
            size="sm"
            :class="labelButtonClass"
            :disabled="isFirstPage"
            @click="emitPage(page - 1)"
        >
            {{ prevLabel }}
        </Button>
        <Button
            variant="outline"
            size="sm"
            :class="labelButtonClass"
            :disabled="isLastPage"
            @click="emitPage(page + 1)"
        >
            {{ nextLabel }}
        </Button>
        <Button
            v-if="firstLast"
            radius="icon"
            variant="outline"
            size="icon"
            class="size-9"
            :disabled="isLastPage"
            aria-label="Halaman terakhir"
            @click="emitPage(resolvedPageCount)"
        >
            <ChevronsRight class="size-4" />
        </Button>
    </template>
</template>
