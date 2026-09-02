<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import EmptyState from '@/components/modules/dashboard/EmptyState.vue';
import EventCard from '@/components/modules/dashboard/events/EventCard.vue';
import EventFilterBar from '@/components/modules/dashboard/events/EventFilterBar.vue';
import { Button } from '@/components/ui/button';
import { FilterX } from 'lucide-vue-next';
import { categoryLabelMap, sessionLabelMap } from '@/lib/dummyData';
import { toCategoryList } from '@/lib/eventCategories';
import { routes } from '@/lib/routes';
import { setTopbar } from '@/utils/composables/useDashboardTopbar';

defineOptions({ layout: DashboardLayout });

const props = withDefaults(
    defineProps<{
        events: IEvent[];
        listMode?: 'mine' | 'browse';
    }>(),
    { listMode: 'browse' }
);

const filterCategory = ref('all');
const filterSession = ref('all');

const isBrowse = computed(() => props.listMode === 'browse');

const categoryOptions = computed(() =>
    Object.entries(categoryLabelMap).map(([value, label]) => ({ value, label }))
);

const categoryFilterOptions = computed(() => [
    { value: 'all', label: 'Semua kategori' },
    ...categoryOptions.value,
]);

const sessionOptions = computed(() => {
    const tokens = new Set<string>();
    for (const event of props.events) {
        for (const session of eventTokenList(event.session)) tokens.add(session);
    }
    return [...tokens]
        .sort((a, b) => (sessionLabelMap[a] ?? a).localeCompare(sessionLabelMap[b] ?? b))
        .map((value) => ({ value, label: sessionLabelMap[value] ?? value }));
});

const sessionFilterOptions = computed(() => [
    { value: 'all', label: 'Semua sesi' },
    ...sessionOptions.value,
]);

function eventTokenList(v: unknown): string[] {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    if (typeof v === 'string')
        return v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    return [];
}

const hasActiveFilters = computed(() => filterCategory.value !== 'all' || filterSession.value !== 'all');

function clearFilters() {
    filterCategory.value = 'all';
    filterSession.value = 'all';
}

const pageTitle = computed(() => (isBrowse.value ? 'Jelajah acara' : 'Acara diikuti'));
const pageSubtitle = computed(() =>
    isBrowse.value
        ? 'Lihat semua acara terpublikasi dan daftar sebagai peserta.'
        : 'Acara yang Anda daftar atau ikuti (tim / undangan yang masih aktif).'
);

const headTitle = computed(() => (isBrowse.value ? 'Jelajah acara' : 'Acara diikuti'));

const filteredEvents = computed(() => {
    let list = props.events;

    if (filterCategory.value !== 'all')
        list = list.filter((e) => toCategoryList(e.category).includes(filterCategory.value));
    if (filterSession.value !== 'all')
        list = list.filter((e) => eventTokenList(e.session).includes(filterSession.value));
    return list;
});

const emptyTitle = computed(() => (isBrowse.value ? 'Tidak ada acara ditemukan' : 'Belum ada acara yang diikuti'));
const emptyDescription = computed(() =>
    isBrowse.value
        ? 'Sesuaikan pencarian atau filter kategori.'
        : 'Telusuri acara terbuka dan daftar untuk melihatnya di sini.'
);

onMounted(() => {
    setTopbar({ title: pageTitle.value, subtitle: pageSubtitle.value });
});
</script>

<template>
    <Head :title="headTitle" />

    <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <EventFilterBar
                v-model:category="filterCategory"
                v-model:session="filterSession"
                :category-options="categoryFilterOptions"
                :session-options="sessionFilterOptions"
            />
            <Button
                v-if="hasActiveFilters"
                variant="outline"
                size="sm"
                class="h-10 shrink-0 gap-2 border-dashed"
                type="button"
                @click="clearFilters"
            >
                <FilterX class="size-3.5 stroke-[1.75]" />
                Reset
            </Button>
        </div>

        <div v-if="filteredEvents.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EventCard
                v-for="event in filteredEvents"
                :key="event.id"
                :event="event"
                :href="routes.member.event.show(event.slug)"
                :can-manage="false"
                :show-price="false"
                :alert-badge="event.pending_team_invitation_url ? 'Diundang' : null"
            />
        </div>

        <EmptyState
            v-else
            :title="emptyTitle"
            :description="emptyDescription"
            animation-url="https://lottie.host/4e039bf3-670e-4a0f-8a6c-1bee793bfc23/JkaGBMIxOz.json"
        >
            <Link
                v-if="!isBrowse"
                :href="routes.member.browse"
                class="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
                Jelajah semua acara
            </Link>
        </EmptyState>
    </div>
</template>
