<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';
</script>

<template>
    <div class="kpi-skeleton rounded-2xl border border-border/70 p-4 shadow-xs">
        <!-- Satu kartu KPI placeholder; jumlah kartu dan grid diatur pemanggil. -->
        <Skeleton class="h-3 w-1/2" />
        <Skeleton class="mt-2 h-7 w-1/3" />
    </div>
</template>
