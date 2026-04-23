<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from 'chart.js'
import { dummyChartData } from '@/lib/dummyData'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const total = dummyChartData.registrationTrends.reduce((s, d) => s + d.count, 0)

const chartData = {
    labels: dummyChartData.registrationTrends.map((d) => d.month),
    datasets: [
        {
            label: 'Registrations',
            data: dummyChartData.registrationTrends.map((d) => d.count),
            borderColor: 'oklch(0.59 0.14 242)',
            backgroundColor: 'oklch(0.59 0.14 242 / 0.06)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'oklch(0.59 0.14 242)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            borderWidth: 2,
        },
    ],
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'oklch(0.145 0 0)',
            titleFont: { size: 12, weight: 500 as const },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
        },
    },
    scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: 'oklch(0.50 0 0)' } },
        y: { grid: { color: 'oklch(0.93 0 0)' }, border: { display: false }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: 'oklch(0.50 0 0)' }, beginAtZero: true },
    },
}
</script>

<template>
    <Card class="rounded-xl border shadow-xs">
        <CardHeader class="pb-2">
            <CardTitle class="text-base font-medium">Registration Trends</CardTitle>
            <CardDescription class="text-xs">{{ total.toLocaleString() }} total registrations</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
            <div class="h-52">
                <Line :data="chartData" :options="chartOptions" />
            </div>
        </CardContent>
    </Card>
</template>
