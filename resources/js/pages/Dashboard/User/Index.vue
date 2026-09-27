<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import KpiCard from '@/components/modules/dashboard/KpiCard.vue';
import KpiCardSkeleton from '@/components/modules/dashboard/KpiCardSkeleton.vue';
import EventCalendar from '@/components/modules/dashboard/EventCalendar.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Zap, Clock, MapPin, ArrowRight } from 'lucide-vue-next';
import { categoryLabelMap, categoryColorMap } from '@/lib/dummyData';
import { formatDisplayDate } from '@/lib/format';
import { toCategoryList } from '@/lib/eventCategories';
import { routes } from '@/lib/routes';
import { EVENT_CARD_BANNER_ASPECT } from '@/lib/eventBannerAspect';
import { setTopbar } from '@/hooks/useDashboardTopbar';

defineOptions({ layout: DashboardLayout });

interface IProps {
    stats:
        | {
              eventsJoined: number;
              upcomingEvents: number;
              pendingRegistrations: number;
              acceptedRegistrations: number;
          }
        | undefined;
    upcomingEvents: IEvent[] | undefined;
    pendingInvitations: Array<{
        event: IEvent;
        invitationUrl: string;
    }>;
    calendarEvents:
        | Array<{
              id: string | number;
              title: string;
              start_date: string;
              end_date: string | null;
              category: string | string[] | null;
              href: string;
          }>
        | undefined;
}

const props = defineProps<IProps>();

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const statsReady = computed<boolean>(() => props.stats !== undefined);
const upcomingReady = computed<boolean>(() => props.upcomingEvents !== undefined);

onMounted(() => {
    setTopbar({ title: 'My Dashboard', subtitle: 'Ringkasan partisipasimu' });
});
</script>

<template>
    <Head title="My Dashboard" />

    <div class="flex flex-col gap-6">
        <div v-if="!statsReady" class="grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Memuat ringkasan dasbor">
            <KpiCardSkeleton v-for="n in 3" :key="`kpi-${n}`" />
        </div>
        <div v-else class="fade-up grid gap-4 sm:grid-cols-3">
            <KpiCard
                label="Events Joined"
                :value="props.stats?.eventsJoined ?? 0"
                :trend="20"
                :icon="CalendarDays"
                color="primary"
            />
            <KpiCard
                label="Upcoming Events"
                :value="props.stats?.upcomingEvents ?? 0"
                :trend="0"
                :icon="Zap"
                color="warning"
            />
            <KpiCard
                label="Pending Registrations"
                :value="props.stats?.pendingRegistrations ?? 0"
                :trend="-10"
                :icon="Clock"
                color="destructive"
            />
        </div>

        <Card class="rounded-xl border shadow-xs">
            <CardHeader class="flex flex-row items-center justify-between pb-3">
                <CardTitle class="text-base font-medium">My Upcoming Events</CardTitle>
                <Button variant="ghost" size="sm" class="text-xs" as-child>
                    <Link :href="routes.member.browse">Lihat semua<ArrowRight class="ml-1 size-3" /></Link>
                </Button>
            </CardHeader>
            <CardContent class="flex flex-col gap-3 pt-0">
                <div v-if="!upcomingReady" aria-busy="true" aria-label="Memuat acara mendatang">
                    <div
                        v-for="n in 4"
                        :key="`upcoming-${n}`"
                        class="upcoming-skeleton flex items-center gap-4 rounded-lg border border-border/70 p-3"
                    >
                        <Skeleton class="h-14 w-20 shrink-0 rounded-md" />
                        <div class="min-w-0 flex-1 space-y-1.5">
                            <Skeleton class="h-4 w-2/3" />
                            <Skeleton class="h-3 w-1/2" />
                        </div>
                        <Skeleton class="h-5 w-16 shrink-0 rounded-full" />
                    </div>
                </div>
                <template v-else>
                    <Link
                        v-for="event in props.upcomingEvents ?? []"
                        :key="event.id"
                        :href="routes.member.event.show(event.slug)"
                        class="fade-up flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                        <div :class="['w-20 shrink-0 overflow-hidden rounded-md bg-muted', EVENT_CARD_BANNER_ASPECT]">
                            <img :src="event.banner_url ?? ''" :alt="event.title" class="h-full w-full object-cover" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium">{{ event.title }}</p>
                            <div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span class="flex items-center gap-1"
                                    ><CalendarDays class="size-3" />{{ formatDisplayDate(event.start_date) }}</span
                                >
                                <span class="flex items-center gap-1"
                                    ><MapPin class="size-3" />{{ event.location }}</span
                                >
                            </div>
                        </div>
                        <div class="flex shrink-0 flex-wrap justify-end gap-1">
                            <Badge
                                v-for="cat in toCategoryList(event.category)"
                                :key="cat"
                                class="text-[10px] text-white"
                                :style="{ backgroundColor: categoryColorMap[cat] ?? '#6B7280' }"
                            >
                                {{ categoryLabelMap[cat] ?? cat }}
                            </Badge>
                        </div>
                    </Link>
                    <p
                        v-if="(props.upcomingEvents ?? []).length === 0"
                        class="py-4 text-center text-sm text-muted-foreground"
                    >
                        No upcoming events. Browse events to find something interesting!
                    </p>
                </template>
            </CardContent>
        </Card>

        <EventCalendar :events="props.calendarEvents ?? []" />
    </div>
</template>
