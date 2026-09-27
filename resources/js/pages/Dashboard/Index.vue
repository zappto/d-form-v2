<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import KpiCard from '@/components/modules/dashboard/KpiCard.vue';
import KpiCardSkeleton from '@/components/modules/dashboard/KpiCardSkeleton.vue';
import RecentEventsCard from '@/components/modules/dashboard/RecentEventsCard.vue';
import RegistrationChart from '@/components/modules/dashboard/RegistrationChart.vue';
import CategoryChart from '@/components/modules/dashboard/CategoryChart.vue';
import EventCalendar from '@/components/modules/dashboard/EventCalendar.vue';
import { CalendarDays, Zap, Users, TrendingUp } from 'lucide-vue-next';
import { Skeleton } from '@/components/ui/skeleton';
import { setTopbar } from '@/hooks/useDashboardTopbar';
import { routes } from '@/lib/routes';

defineOptions({ layout: DashboardLayout });

const props = defineProps<{
    recentEvents: IEvent[] | undefined;
    calendarEvents: ICalendarEvent[] | undefined;
    stats:
        | {
              totalEvents: number;
              activeEvents: number;
              totalRegistrants: number;
              completionRate: number;
          }
        | undefined;
    adminCharts?: {
        registrationTrend: { key: string; label: string; count: number }[];
        categoryBreakdown: { token: string; count: number }[];
    } | null;
}>();

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const statsReady = computed(() => props.stats !== undefined);
const eventsReady = computed(() => props.recentEvents !== undefined);

const events = computed(() => props.recentEvents ?? []);

const totalEvents = computed(() => props.stats?.totalEvents ?? 0);
const activeEvents = computed(() => props.stats?.activeEvents ?? 0);
const totalRegistrants = computed(() => props.stats?.totalRegistrants ?? 0);
const completionRate = computed(() => props.stats?.completionRate ?? 0);

onMounted(() => {
    setTopbar({ title: 'Ringkasan acara', subtitle: 'Pantau pendaftaran, jadwal, dan performa acara' });
});
</script>

<template>
    <Head title="Beranda" />

    <div class="flex flex-col gap-10 md:gap-12">
        <section class="space-y-4">
            <h2 class="font-display text-base font-bold tracking-tight text-foreground">Metrik utama</h2>
            <div
                v-if="!statsReady"
                class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-busy="true"
                aria-label="Memuat ringkasan"
            >
                <KpiCardSkeleton v-for="n in 4" :key="`kpi-${n}`" />
            </div>
            <div v-else class="fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Total acara" :value="totalEvents" :icon="CalendarDays" color="primary" />
                <KpiCard label="Acara aktif" :value="activeEvents" :icon="Zap" color="warning" />
                <KpiCard
                    label="Total pendaftar"
                    :value="totalRegistrants.toLocaleString('id-ID')"
                    :icon="Users"
                    color="success"
                />
                <KpiCard
                    label="Tingkat isi kuota"
                    :value="completionRate + '%'"
                    :icon="TrendingUp"
                    color="primary"
                />
            </div>
        </section>

        <section class="space-y-4">
            <h2 class="font-display text-base font-bold tracking-tight text-foreground">Aktivitas & kalender</h2>
            <div class="grid gap-5 lg:grid-cols-3 lg:items-start">
                <div class="lg:col-span-2">
                    <div
                        v-if="!eventsReady"
                        aria-busy="true"
                        aria-label="Memuat acara terbaru"
                        class="recent-skeleton rounded-2xl border border-border/70 p-4 shadow-sm"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="space-y-2">
                                <Skeleton class="h-5 w-32" />
                                <Skeleton class="h-3 w-48" />
                            </div>
                            <Skeleton class="h-8 w-24 shrink-0" />
                        </div>
                        <div class="mt-4 flex flex-col gap-1">
                            <div v-for="n in 4" :key="`recent-${n}`" class="flex items-start gap-3 rounded-xl p-2">
                                <Skeleton class="hidden h-14 w-16 shrink-0 rounded-lg sm:block" />
                                <div class="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton class="h-4 w-2/3" />
                                    <Skeleton class="h-3 w-1/2" />
                                </div>
                                <Skeleton class="h-5 w-14 shrink-0" />
                            </div>
                        </div>
                    </div>
                    <RecentEventsCard
                        v-else
                        class="fade-up"
                        :events="events"
                        :view-all-href="routes.admin.events.index"
                        :event-base-href="routes.admin.events.index"
                    />
                </div>
                <EventCalendar :events="calendarEvents" />
            </div>
        </section>

        <section v-if="adminCharts === undefined" class="space-y-4">
            <h2 class="font-display text-base font-bold tracking-tight text-foreground">Analitik singkat</h2>
            <div
                class="grid gap-5 lg:grid-cols-2"
                aria-busy="true"
                aria-label="Memuat analitik"
            >
                <div v-for="n in 2" :key="`chart-${n}`" class="chart-skeleton rounded-2xl border border-border/70">
                    <div class="border-b border-border/50 px-5 py-4">
                        <Skeleton class="h-5 w-40" />
                    </div>
                    <div class="p-4 sm:p-5">
                        <Skeleton class="min-h-[15rem] w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </section>

        <section v-else-if="adminCharts" class="space-y-4">
            <h2 class="font-display text-base font-bold tracking-tight text-foreground">Analitik singkat</h2>
            <div class="fade-up grid gap-5 lg:grid-cols-2">
                <RegistrationChart
                    :points="adminCharts.registrationTrend.map(({ label, count }) => ({ label, count }))"
                />
                <CategoryChart :breakdown="adminCharts.categoryBreakdown" />
            </div>
        </section>
    </div>
</template>
