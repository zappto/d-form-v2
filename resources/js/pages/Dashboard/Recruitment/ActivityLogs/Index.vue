<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/modules/dashboard/EmptyState.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/lib/routes';
import { type IPaginator, type IPaginationLink } from '@/lib/pagination';
import { setTopbar } from '@/hooks/useDashboardTopbar';

defineOptions({ layout: DashboardLayout });

interface ILogRow {
    id: string;
    action: string;
    actor_type: string;
    actor: { id: string; name: string } | null;
    application: {
        id: string;
        recruitment_period_id: string | null;
        registration_number: string;
        full_name: string;
    } | null;
    created_at: string | null;
}

/** Props paginator log; `data` diambil dari `IPaginator`, `links` memakai `IPaginationLink` (selalu ada di halaman ini). */
type TActivityLogPage = Pick<IPaginator<ILogRow>, 'data'> & { links: IPaginationLink[] };

defineProps<{
    logs: TActivityLogPage;
    periodOptions: { id: string; name: string }[];
    query: { period_id: string | null; action: string | null };
}>();

onMounted(() => {
    setTopbar({ title: 'Activity log Open Recruitment', subtitle: 'Audit trail keputusan staff' });
});

function applyFilters(periodId: string, action: string) {
    router.get(
        routes.admin.recruitment.activityLogs.index,
        {
            period_id: periodId || undefined,
            action: action || undefined,
        },
        {
            preserveState: true,
            onStart: () => {
                isLoadingLogs.value = true;
            },
            onFinish: () => {
                isLoadingLogs.value = false;
            },
        }
    );
}

/** Skeleton daftar selama partial visit filter (pola M2 Task 1). */
const isLoadingLogs = ref(false);

/** Nilai teks dari event input/select/textarea; string kosong bila target bukan elemen bernilai. */
function fieldValue(event: Event): string {
    const target = event.target;
    if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
    ) {
        return target.value;
    }
    return '';
}
</script>

<template>
    <Head title="Activity Log Open Recruitment" />

    <div class="flex w-full max-w-full min-w-0 flex-col gap-6 pt-0 pb-8 sm:gap-8 sm:pb-10">
        <Card class="rounded-2xl border-border/70">
            <CardContent class="flex flex-wrap gap-3 p-4">
                <select
                    class="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    :value="query.period_id ?? ''"
                    @change="applyFilters(fieldValue($event), query.action ?? '')"
                >
                    <option value="">Semua periode</option>
                    <option v-for="period in periodOptions" :key="period.id" :value="period.id">
                        {{ period.name }}
                    </option>
                </select>
                <input
                    type="search"
                    class="h-9 min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Filter action..."
                    :value="query.action ?? ''"
                    @change="applyFilters(query.period_id ?? '', fieldValue($event))"
                />
            </CardContent>
        </Card>

        <Card class="rounded-2xl border-border/70">
            <CardContent class="divide-y p-0">
                <div v-if="isLoadingLogs" aria-busy="true" aria-label="Memuat activity log">
                    <div v-for="n in 8" :key="`log-${n}`" class="log-row-skeleton space-y-1 p-4">
                        <div class="flex flex-wrap items-start justify-between gap-2">
                            <Skeleton class="h-4 w-2/5" />
                            <Skeleton class="h-3 w-24" />
                        </div>
                        <Skeleton class="h-3 w-1/3" />
                    </div>
                </div>
                <template v-else>
                    <div v-for="log in logs.data" :key="log.id" class="fade-up space-y-1 p-4 text-sm">
                        <div class="flex flex-wrap items-start justify-between gap-2">
                            <p class="font-medium">{{ log.action }}</p>
                            <p class="text-xs text-muted-foreground">
                                {{ log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '—' }}
                            </p>
                        </div>
                        <p class="text-xs text-muted-foreground">
                            {{ log.actor?.name ?? log.actor_type }}
                            <template v-if="log.application">
                                ·
                                <Link
                                    v-if="log.application.recruitment_period_id"
                                    :href="routes.admin.recruitment.periods.show(log.application.recruitment_period_id)"
                                    class="text-primary underline"
                                >
                                    {{ log.application.registration_number }}
                                </Link>
                                <span v-else>{{ log.application.registration_number }}</span>
                            </template>
                        </p>
                    </div>
                    <div v-if="logs.data.length === 0" class="p-6">
                        <EmptyState variant="inline" title="Tidak ada activity log." />
                    </div>
                </template>
            </CardContent>
        </Card>

        <div v-if="logs.links.length > 3" class="flex flex-wrap gap-2">
            <Button
                v-for="link in logs.links"
                :key="link.label"
                as-child
                size="sm"
                :variant="link.active ? 'default' : 'outline'"
                :disabled="!link.url"
            >
                <Link v-if="link.url" :href="link.url" preserve-state>{{ link.label }}</Link>
                <span v-else>{{ link.label }}</span>
            </Button>
        </div>
    </div>
</template>
