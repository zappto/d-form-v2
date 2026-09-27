<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Head } from '@inertiajs/vue3'
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue'
import KpiCard from '@/components/modules/dashboard/KpiCard.vue'
import KpiCardSkeleton from '@/components/modules/dashboard/KpiCardSkeleton.vue'
import EventReportingFocusPanel from '@/components/modules/dashboard/EventReportingFocusPanel.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, ClipboardList, ScanLine, Download } from 'lucide-vue-next'
import { setTopbar } from '@/hooks/useDashboardTopbar'

defineOptions({ layout: DashboardFocusLayout })

const props = defineProps<{
    globalSummary:
        | {
              total_events: number
              total_submissions: number
              total_attendance_records: number
          }
        | undefined
    event: IEvent | undefined
    exports: { registrations: string; attendance: string } | undefined
    eventReporting:
        | {
              summary: {
                  submission_count: number
                  attended_count: number
                  attendance_rate_percent: number | null
                  registered_count: number
                  quota: number | null
              }
              attendanceLog: {
                  data: {
                      id: string
                      scanned_at: string
                      form_answer_id: string
                      attendee: { name: string; email: string } | null
                      scanned_by: { name: string; email: string } | null
                  }[]
                  current_page: number
                  last_page: number
                  per_page: number
                  total: number
                  links?: { url: string | null; label: string; active: boolean }[]
              }
          }
        | undefined
}>()

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const summaryReady = computed<boolean>(() => props.globalSummary !== undefined)
const focusReady = computed<boolean>(
    () => props.event !== undefined && props.exports !== undefined && props.eventReporting !== undefined,
)

onMounted(() => {
    setTopbar({ title: 'Laporan', subtitle: 'Unduhan CSV & ringkasan acara' })
})

</script>

<template>
    <Head :title="props.event ? `Laporan — ${props.event.title}` : 'Laporan'" />

    <div class="flex flex-col gap-8 md:gap-10">
        <div
            v-if="!summaryReady"
            class="grid gap-4 sm:grid-cols-3"
            aria-busy="true"
            aria-label="Memuat ringkasan laporan"
        >
            <KpiCardSkeleton v-for="n in 3" :key="`kpi-${n}`" />
        </div>
        <div v-else class="fade-up grid gap-4 sm:grid-cols-3">
            <KpiCard label="Events" :value="globalSummary?.total_events ?? 0" :icon="BarChart3" color="primary" />
            <KpiCard label="All submissions" :value="globalSummary?.total_submissions ?? 0" :icon="ClipboardList" color="warning" />
            <KpiCard label="Attendance records" :value="globalSummary?.total_attendance_records ?? 0" :icon="ScanLine" color="success" />
        </div>

        <Card class="rounded-xl border shadow-xs">
            <CardHeader class="pb-3">
                <CardTitle class="text-base font-medium">Focus event</CardTitle>
                <CardDescription class="text-xs">
                    Laporan untuk acara berikut beserta unduhan CSV pendaftaran dan kehadiran.
                </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div class="flex min-w-[220px] flex-1 flex-col gap-1.5">
                    <Label for="laporan-event-title" class="text-xs font-semibold uppercase text-muted-foreground">Event</Label>
                    <p
                        v-if="event"
                        id="laporan-event-title"
                        class="flex min-h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm font-medium text-foreground shadow-xs"
                    >
                        {{ event.title }}
                    </p>
                    <Skeleton v-else class="min-h-10 w-full" aria-hidden="true" />
                </div>
                <div class="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" as-child class="">
                        <a :href="exports?.registrations ?? '#'">
                            <Download class="mr-1.5 size-4" />Registrations CSV
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" as-child class="">
                        <a :href="exports?.attendance ?? '#'">
                            <Download class="mr-1.5 size-4" />Attendance CSV
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div
            v-if="!focusReady"
            aria-busy="true"
            aria-label="Memuat laporan acara"
            class="focus-panel-skeleton flex flex-col gap-4"
        >
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div v-for="n in 4" :key="`mini-${n}`" class="rounded-2xl border border-border/70 p-4 shadow-xs">
                    <Skeleton class="h-3 w-2/3" />
                    <Skeleton class="mt-2 h-7 w-1/3" />
                </div>
            </div>
            <div class="rounded-xl border shadow-xs">
                <div class="pb-3 pt-4 px-4">
                    <Skeleton class="h-4 w-40" />
                    <Skeleton class="mt-1.5 h-3 w-2/3" />
                </div>
                <div class="overflow-x-auto px-0">
                    <table class="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr class="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <th class="px-4 py-3">Scanned at</th>
                                <th class="px-4 py-3">Attendee</th>
                                <th class="px-4 py-3">Submission</th>
                                <th class="px-4 py-3">Scanned by</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="n in 10"
                                :key="`fokus-${n}`"
                                class="focus-row-skeleton border-b border-border/60 last:border-0"
                            >
                                <td class="px-4 py-3"><Skeleton class="h-4 w-24" /></td>
                                <td class="px-4 py-3">
                                    <div class="space-y-1.5">
                                        <Skeleton class="h-4 w-32" />
                                        <Skeleton class="h-3 w-40" />
                                    </div>
                                </td>
                                <td class="px-4 py-3"><Skeleton class="h-3 w-20 font-mono" /></td>
                                <td class="px-4 py-3">
                                    <div class="space-y-1.5">
                                        <Skeleton class="h-4 w-28" />
                                        <Skeleton class="h-3 w-36" />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="focus-pager-skeleton flex items-center justify-between gap-2 px-4 py-3.5">
                        <Skeleton class="h-4 w-32" />
                        <div class="flex gap-2">
                            <Skeleton class="h-8 w-24" />
                            <Skeleton class="h-8 w-24" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <EventReportingFocusPanel
            v-else
            class="fade-up"
            :event-title="event?.title ?? ''"
            :summary="eventReporting?.summary ?? { submission_count: 0, attended_count: 0, attendance_rate_percent: null, registered_count: 0, quota: null }"
            :export-urls="exports ?? { registrations: '#', attendance: '#' }"
            :attendance-log="eventReporting?.attendanceLog ?? { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 }"
            :show-export-toolbar="false"
        />
    </div>
</template>
