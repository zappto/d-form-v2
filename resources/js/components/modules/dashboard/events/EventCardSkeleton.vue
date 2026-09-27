<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';
</script>

<template>
    <div class="event-card-skeleton flex min-w-0 flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <!-- Satu kartu placeholder; jumlah item dan grid diatur pemanggil. -->
        <div class="flex items-center justify-between gap-3">
            <Skeleton class="h-6 w-20 rounded-full" />
            <Skeleton class="size-8 shrink-0" />
        </div>
        <Skeleton class="aspect-[16/7] w-full rounded-xl" />
        <div class="flex items-center gap-3">
            <Skeleton class="h-4 min-w-0 flex-1" />
            <Skeleton class="h-6 w-16 shrink-0 rounded-full" />
        </div>
        <Skeleton class="h-3 w-3/4" />
        <Skeleton class="h-3 w-1/2" />
        <div class="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <Skeleton class="h-3 w-1/3" />
            <Skeleton class="h-4 w-16 shrink-0" />
        </div>
    </div>
</template>
