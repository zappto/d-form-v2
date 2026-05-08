<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { Button } from '@/components/ui/button'
import { submissionPaginationLabel } from '@/lib/formSubmissionsUi'

interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

withDefaults(
    defineProps<{
        links: PaginationLink[] | undefined
        currentPage: number
        lastPage: number
        total: number
        /** Kata setelah angka total, mis. "pengiriman" atau "rekaman". */
        totalLabel?: string
    }>(),
    { totalLabel: 'pengiriman' },
)

function formatInt(n: number): string {
    return new Intl.NumberFormat('id-ID').format(n)
}
</script>

<template>
    <div class="flex flex-col items-center gap-3 pt-8">
        <p class="text-center text-sm text-muted-foreground">
            Halaman
            <span class="font-medium text-foreground">{{ formatInt(currentPage) }}</span>
            dari
            <span class="font-medium text-foreground">{{ formatInt(lastPage) }}</span>
            <span class="text-border"> · </span>
            <span class="font-medium text-foreground">{{ formatInt(total) }}</span>
            {{ totalLabel }}
        </p>
        <div v-if="links && lastPage > 1" class="flex flex-wrap items-center justify-center gap-1.5">
            <Button
                v-for="link in links"
                :key="link.label"
                variant="outline"
                size="sm"
                :class="[
                    'h-9 min-w-9',
                    link.active ? 'border-primary bg-primary/10 text-primary' : '',
                    !link.url ? 'opacity-40' : '',
                ]"
                :disabled="!link.url"
                as-child
            >
                <Link v-if="link.url" :href="link.url">{{ submissionPaginationLabel(link.label) }}</Link>
                <span v-else>{{ submissionPaginationLabel(link.label) }}</span>
            </Button>
        </div>
    </div>
</template>
