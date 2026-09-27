<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/modules/dashboard/EmptyState.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/lib/routes'
import { Download, Funnel, GraduationCap, Users } from 'lucide-vue-next'

interface ReportPayload {
    period: { id: string; name: string } | null
    funnel: { stage: string; label: string; count: number }[]
    by_division: { division: string; count: number }[]
    by_semester: { semester: number; count: number }[]
    interview_stats: Record<string, number>
    feedback: { count: number; averages: Record<string, number | null> }
}

const props = defineProps<{
    periodId: string
    report: ReportPayload | null
    loading?: boolean
}>()

const maxFunnel = computed(() =>
    Math.max(1, ...(props.report?.funnel.map((row) => row.count) ?? [1])),
)
</script>

<template>
    <div class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Laporan periode ini
            </h2>
            <div class="flex flex-wrap gap-2">
                <Button as-child size="sm" variant="outline">
                    <a :href="routes.admin.recruitment.reports.exportFunnel(periodId)">
                        <Download class="mr-2 size-4" aria-hidden="true" />
                        Export funnel CSV
                    </a>
                </Button>
                <Button as-child size="sm">
                    <a :href="routes.admin.recruitment.reports.exportApplicants(periodId)">
                        <Download class="mr-2 size-4" aria-hidden="true" />
                        Export applicant CSV
                    </a>
                </Button>
            </div>
        </div>

        <div v-if="loading" aria-busy="true" aria-label="Memuat laporan periode">
            <div class="report-funnel-skeleton rounded-2xl border border-border/70 bg-card">
                <div class="flex items-center gap-2 px-4 pt-4 sm:px-6">
                    <Skeleton class="size-4 shrink-0" />
                    <Skeleton class="h-4 w-40" />
                </div>
                <div class="space-y-3 p-4 sm:p-6">
                    <div class="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                        <Skeleton class="h-3 w-24" />
                        <Skeleton class="mt-1.5 h-8 w-16" />
                    </div>
                    <div v-for="n in 4" :key="`funnel-${n}`" class="report-row-skeleton space-y-1.5">
                        <div class="flex items-center justify-between gap-3">
                            <Skeleton class="h-4 w-1/3" />
                            <Skeleton class="h-4 w-10" />
                        </div>
                        <Skeleton class="h-2 w-full rounded-full" />
                    </div>
                </div>
            </div>

            <div class="mt-5 grid gap-5 lg:grid-cols-2">
                <div v-for="n in 2" :key="`grid-${n}`" class="report-grid-skeleton rounded-2xl border border-border/70 bg-card">
                    <div class="flex items-center gap-2 px-4 pt-4 sm:px-6">
                        <Skeleton class="size-4 shrink-0" />
                        <Skeleton class="h-4 w-32" />
                    </div>
                    <div class="space-y-2.5 p-4 text-sm sm:p-6">
                        <div v-for="m in 3" :key="`baris-${n}-${m}`" class="flex items-center justify-between gap-3 py-0.5">
                            <Skeleton class="h-4 w-1/2" />
                            <Skeleton class="h-4 w-10" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template v-else-if="report">
        <Card class="fade-up rounded-2xl border-border/70">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 text-sm font-semibold">
                    <Funnel class="text-muted-foreground size-4" aria-hidden="true" />
                    Funnel recruitment
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
                <div v-if="report.funnel[0]" class="rounded-xl border bg-muted/30 px-4 py-3">
                    <p class="text-muted-foreground text-xs uppercase">{{ report.funnel[0].label }}</p>
                    <p class="mt-0.5 text-2xl font-semibold tabular-nums">{{ report.funnel[0].count }}</p>
                </div>
                <div v-for="row in report.funnel.slice(1)" :key="row.stage" class="space-y-1.5">
                    <div class="flex items-center justify-between gap-3 text-sm">
                        <span>{{ row.label }}</span>
                        <span
                            class="font-medium tabular-nums"
                            :class="row.count === 0 ? 'text-muted-foreground' : ''"
                        >
                            {{ row.count }}
                        </span>
                    </div>
                    <div class="bg-muted h-2 rounded-full">
                        <div
                            class="bg-primary h-2 rounded-full transition-all"
                            :style="{ width: `${(row.count / maxFunnel) * 100}%` }"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div class="fade-up grid gap-5 lg:grid-cols-2">
            <Card class="rounded-2xl border-border/70">
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-sm font-semibold">
                        <Users class="text-muted-foreground size-4" aria-hidden="true" />
                        Per divisi utama
                    </CardTitle>
                </CardHeader>
                <CardContent class="text-sm">
                    <div v-if="report.by_division.length > 0" class="divide-y divide-border/60">
                        <div
                            v-for="row in report.by_division"
                            :key="row.division"
                            class="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                            <span>{{ row.division }}</span>
                            <span class="font-medium tabular-nums">{{ row.count }}</span>
                        </div>
                    </div>
                    <EmptyState v-else variant="inline" title="Belum ada data." />
                </CardContent>
            </Card>

            <Card class="rounded-2xl border-border/70">
                <CardHeader>
                    <CardTitle class="flex items-center gap-2 text-sm font-semibold">
                        <GraduationCap class="text-muted-foreground size-4" aria-hidden="true" />
                        Per semester
                    </CardTitle>
                </CardHeader>
                <CardContent class="text-sm">
                    <div v-if="report.by_semester.length > 0" class="divide-y divide-border/60">
                        <div
                            v-for="row in report.by_semester"
                            :key="row.semester"
                            class="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                            <span>Semester {{ row.semester }}</span>
                            <span class="font-medium tabular-nums">{{ row.count }}</span>
                        </div>
                    </div>
                    <EmptyState v-else variant="inline" title="Belum ada data." />
                </CardContent>
            </Card>
        </div>
        </template>
        <p v-else class="text-muted-foreground text-sm">Data laporan tidak tersedia untuk tab ini.</p>
    </div>
</template>
