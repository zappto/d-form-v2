<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTickCallback, formatChartCount } from '@/lib/format';
import { baseChartTooltipOptions, chartThemeTokens } from '@/lib/chartTheme';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, type ChartOptions } from 'chart.js';
import { categoryLabelMap, categoryColorMap } from '@/lib/dummyData';
import { LayoutGrid } from 'lucide-vue-next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = withDefaults(
    defineProps<{
        breakdown?: { token: string; count: number }[];
    }>(),
    { breakdown: () => [] }
);

const labels = computed(() => props.breakdown.map((d) => categoryLabelMap[d.token] ?? d.token));

const barColors = computed(() => props.breakdown.map((d) => categoryColorMap[d.token] ?? 'oklch(0.52 0.16 255)'));

const totalInChart = computed(() => props.breakdown.reduce((s, d) => s + d.count, 0));

const chartData = computed(() => ({
    labels: labels.value,
    datasets: [
        {
            label: 'Jumlah acara',
            data: props.breakdown.map((d) => d.count),
            backgroundColor: barColors.value,
            borderColor: 'oklch(1 0 0)',
            borderWidth: 1.5,
            borderRadius: 10,
            borderSkipped: false,
            maxBarThickness: 32,
        },
    ],
}));

const chartOptions = computed<ChartOptions<'bar'>>(() => {
    const chartTokens = chartThemeTokens();

    return {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                ...baseChartTooltipOptions(chartTokens),
                displayColors: true,
                boxPadding: 4,
                callbacks: {
                    label(ctx) {
                        const n = ctx.parsed.x ?? 0;
                        return ` ${formatChartCount(n, 'acara')}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { color: chartTokens.grid, drawTicks: false },
                border: { display: false },
                beginAtZero: true,
                ticks: {
                    font: { size: 11, family: 'Poppins, sans-serif' },
                    color: chartTokens.tick,
                    precision: 0,
                    callback: chartTickCallback,
                },
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { size: 12, weight: 500, family: 'Poppins, sans-serif' },
                    color: chartTokens.tick,
                    autoSkip: false,
                },
            },
        },
    };
});
</script>

<template>
    <Card class="overflow-hidden rounded-2xl border-border/70 shadow-sm ring-1 ring-black/[0.03]">
        <CardHeader
            class="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-muted/10 px-5 py-4 sm:px-6"
        >
            <div class="flex min-w-0 items-center gap-3">
                <div
                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary shadow-inner"
                >
                    <LayoutGrid class="size-5" />
                </div>
                <div class="min-w-0">
                    <CardTitle class="font-display text-lg font-bold tracking-[-0.02em] md:text-xl">
                        Acara per kategori
                    </CardTitle>
                    <p class="mt-0.5 font-display text-2xl font-bold tracking-tight text-muted-foreground tabular-nums">
                        {{ totalInChart.toLocaleString('id-ID') }}
                    </p>
                </div>
            </div>
        </CardHeader>
        <CardContent class="space-y-4 p-4 sm:p-5">
            <div
                v-if="breakdown.length === 0"
                class="flex min-h-[15rem] items-center justify-center rounded-xl bg-muted/20 text-sm font-medium text-muted-foreground/90"
            >
                Tidak ada data
            </div>
            <template v-else>
                <div class="rounded-xl bg-gradient-to-b from-muted/25 to-transparent p-2 sm:min-h-[18rem]">
                    <Bar :data="chartData" :options="chartOptions" />
                </div>
                <ul class="flex flex-wrap gap-2">
                    <li
                        v-for="row in breakdown"
                        :key="row.token"
                        class="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1 text-xs font-medium shadow-xs"
                    >
                        <span
                            class="size-2.5 shrink-0 rounded-full shadow-sm"
                            :style="{ backgroundColor: categoryColorMap[row.token] ?? 'var(--muted-foreground)' }"
                        />
                        <span>{{ categoryLabelMap[row.token] ?? row.token }}</span>
                        <span class="text-muted-foreground tabular-nums">{{ row.count.toLocaleString('id-ID') }}</span>
                    </li>
                </ul>
            </template>
        </CardContent>
    </Card>
</template>
