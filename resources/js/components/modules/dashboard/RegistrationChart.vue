<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTickCallback, formatChartCount } from '@/lib/format';
import { baseChartTooltipOptions, chartThemeTokens } from '@/lib/chartTheme';
import { Line } from 'vue-chartjs';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { TrendingUp } from 'lucide-vue-next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const props = withDefaults(
    defineProps<{
        points?: { label: string; count: number }[];
    }>(),
    { points: () => [] }
);

const total = computed(() => props.points.reduce((s, d) => s + d.count, 0));

const chartData = computed(() => ({
    labels: props.points.map((d) => d.label),
    datasets: [
        {
            label: 'Pengajuan',
            data: props.points.map((d) => d.count),
            borderColor: 'oklch(0.52 0.16 255)',
            backgroundColor: 'oklch(0.52 0.16 255 / 0.14)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: 'oklch(0.52 0.16 255)',
            pointBorderColor: 'oklch(1 0 0)',
            pointHoverBackgroundColor: 'oklch(0.45 0.15 255)',
            pointHoverBorderColor: 'oklch(0.18 0.018 255)',
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2,
            borderWidth: 2.5,
        },
    ],
}));

const chartOptions = computed<ChartOptions<'line'>>(() => {
    const chartTokens = chartThemeTokens();

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                ...baseChartTooltipOptions(chartTokens),
                displayColors: false,
                callbacks: {
                    title(items) {
                        return items[0]?.label ?? '';
                    },
                    label(ctx) {
                        const n = ctx.parsed.y ?? 0;
                        return formatChartCount(n, 'pengajuan');
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { size: 11, family: 'Poppins, sans-serif' },
                    color: chartTokens.tick,
                    maxRotation: 45,
                    minRotation: 0,
                },
            },
            y: {
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
                    <TrendingUp class="size-5" />
                </div>
                <div class="min-w-0">
                    <CardTitle class="font-display text-lg font-bold tracking-[-0.02em] md:text-xl">
                        Tren pengajuan
                    </CardTitle>
                    <p class="mt-0.5 font-display text-2xl font-bold tracking-tight text-muted-foreground tabular-nums">
                        {{ total.toLocaleString('id-ID') }}
                    </p>
                </div>
            </div>
        </CardHeader>
        <CardContent class="p-4 sm:p-5">
            <div
                v-if="points.length === 0 || total === 0"
                class="flex min-h-[15rem] items-center justify-center rounded-xl bg-muted/20 text-sm font-medium text-muted-foreground/90"
            >
                Tidak ada data
            </div>
            <div v-else class="rounded-xl bg-gradient-to-b from-muted/25 to-transparent p-2 sm:min-h-[16rem]">
                <Line :data="chartData" :options="chartOptions" />
            </div>
        </CardContent>
    </Card>
</template>
