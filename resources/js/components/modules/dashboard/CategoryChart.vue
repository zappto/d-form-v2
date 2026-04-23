<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from 'chart.js'
import { dummyChartData } from '@/lib/dummyData'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const colors = [
    'oklch(0.59 0.14 242)',
    'oklch(0.58 0.18 280)',
    'oklch(0.55 0.14 160)',
    'oklch(0.65 0.16 65)',
]

const totalEvents = dummyChartData.categoryBreakdown.reduce((s, d) => s + d.count, 0)

const chartData = {
    labels: dummyChartData.categoryBreakdown.map((d) => d.category),
    datasets: [
        {
            label: 'Events',
            data: dummyChartData.categoryBreakdown.map((d) => d.count),
            backgroundColor: colors,
            borderRadius: 8,
            barThickness: 36,
        },
    ],
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'oklch(0.145 0 0)',
            titleFont: { size: 12, weight: 500 as const },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
        },
    },
    scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: 'oklch(0.50 0 0)' } },
        y: { grid: { color: 'oklch(0.93 0 0)' }, border: { display: false }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: 'oklch(0.50 0 0)', stepSize: 1 }, beginAtZero: true },
    },
}
</script>

<template>
    <Card class="rounded-xl border shadow-xs">
        <CardHeader class="pb-2">
            <CardTitle class="text-base font-medium">Events by Category</CardTitle>
            <CardDescription class="text-xs">{{ totalEvents }} events total</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
            <div class="h-52">
                <Bar :data="chartData" :options="chartOptions" />
            </div>
        </CardContent>
    </Card>
</template>
