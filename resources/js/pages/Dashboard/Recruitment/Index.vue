<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import DivisionListSheet, {
    type TIDashboardDivision,
} from '@/components/modules/dashboard/recruitment/DivisionListSheet.vue';
import DataPagination from '@/components/modules/dashboard/DataPagination.vue';
import EmptyState from '@/components/modules/dashboard/EmptyState.vue';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';
import { showErrorToast } from '@/lib/error-message';
import type { IPaginator } from '@/lib/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { setTopbar } from '@/hooks/useDashboardTopbar';
import useAuth from '@/hooks/useAuth';
import { usePage } from '@inertiajs/vue3';
import { CalendarRange, ImageOff, Layers, User, Users, ClipboardList, ListOrdered, Trash2 } from 'lucide-vue-next';

defineOptions({ layout: DashboardLayout });

interface IPeriodSummary {
    id: string;
    name: string;
    status: string;
    status_label: string;
}

interface IActionQueue {
    key: string;
    label: string;
    description: string;
    count: number;
}

interface ITodaySession {
    id: string;
    session_date: string;
    starts_at: string;
    ends_at: string;
    location: string;
    room: string;
    interviews_count: number;
    division: { name: string } | null;
}

interface IPeriodCreator {
    name: string;
    avatar_url: string | null;
}

interface IPeriodRow {
    id: string;
    name: string;
    slug: string;
    status: string;
    status_label: string;
    banner_url: string | null;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    applications_count: number;
    creator?: IPeriodCreator | null;
    can_edit?: boolean;
    can_delete?: boolean;
}

const props = withDefaults(
    defineProps<{
        summary: {
            active_period: IPeriodSummary | null;
            stats: Record<string, number>;
            funnel?: { stage: string; label: string; count: number }[];
            accepted_count?: number;
            is_interviewer_view?: boolean;
            action_queues?: IActionQueue[];
            today_sessions?: ITodaySession[];
        };
        periods?: IPaginator<IPeriodRow> | null;
        query?: { search?: string; status?: string };
        statusOptions?: { value: string; label: string }[];
        divisions?: TIDashboardDivision[];
    }>(),
    { periods: null, query: () => ({}), statusOptions: () => [], divisions: () => [] }
);

const page = usePage();
const user = useAuth(page.props);
const canManagePeriods = computed(() => user.value?.can_manage_recruitment_periods === true);
const canScheduleInterviews = computed(() => user.value?.can_schedule_recruitment_interviews === true);
const canViewQueue = computed(() => user.value?.can_view_recruitment_queue === true);

const actionQueues = computed(() => props.summary.action_queues ?? []);
const todaySessions = computed(() => props.summary.today_sessions ?? []);

const periodRows = computed<IPeriodRow[]>(() => props.periods?.data ?? []);
const periodCurrentPage = computed<number>(() => props.periods?.current_page ?? 1);
const periodLastPage = computed<number>(() => props.periods?.last_page ?? 1);
const periodTotal = computed<number>(() => props.periods?.total ?? 0);

const divisionRows = computed<TIDashboardDivision[]>(() => props.divisions ?? []);
const divisionDrawerOpen = ref<boolean>(false);

function openDivisionDrawer(): void {
    divisionDrawerOpen.value = true;
}

function closeDivisionDrawer(): void {
    divisionDrawerOpen.value = false;
}

/** Selaras dengan pemetaan di Periods/Show.vue — token design system, bukan warna arbitrary. */
const periodStatusClasses: Record<string, string> = {
    draft: 'border-border bg-secondary text-secondary-foreground',
    open: 'border-success/20 bg-success/10 text-success',
    closed: 'border-warning/25 bg-warning/10 text-warning-foreground',
    archived: 'border-border bg-muted text-muted-foreground',
};

function periodStatusClass(status: string): string {
    return periodStatusClasses[status] ?? 'border-border bg-secondary text-secondary-foreground';
}

const periodSearch = ref<string>(props.query?.search ?? '');
const periodStatus = ref<string>(props.query?.status ?? '');

/** Opsi dropdown status — nilai dari backend, UI SearchableSelect seperti admin/events. */
const periodStatusOptions = computed<SearchableSelectOption[]>(() => [
    { value: '', label: 'Semua status' },
    ...props.statusOptions,
]);

/** Skeleton zona daftar selama partial visit filter/paginasi (pola M2 Task 1). */
const isLoadingPeriods = ref<boolean>(false);

function applyPeriodFilters(page: number = 1): void {
    router.get(
        routes.admin.recruitment.index,
        {
            search: periodSearch.value || undefined,
            status: periodStatus.value || undefined,
            page: page > 1 ? page : undefined,
        },
        {
            preserveState: true,
            replace: true,
            onStart: () => {
                isLoadingPeriods.value = true;
            },
            onFinish: () => {
                isLoadingPeriods.value = false;
            },
        }
    );
}

watch([periodSearch, periodStatus], () => applyPeriodFilters());

const quickApplicantHref = computed(() =>
    props.summary.active_period
        ? routes.admin.recruitment.periods.show(props.summary.active_period.id)
        : routes.admin.recruitment.index
);

const quickInterviewHref = computed(() =>
    props.summary.active_period
        ? `${routes.admin.recruitment.periods.show(props.summary.active_period.id)}?tab=interview`
        : routes.admin.recruitment.index
);

function applicationsQueueUrl(queue: string): string {
    const periodId = props.summary.active_period?.id;
    if (!periodId) return routes.admin.recruitment.index;
    const params = new URLSearchParams({ queue });
    return `${routes.admin.recruitment.periods.show(periodId)}?${params.toString()}`;
}

/** Konfirmasi hapus periode — soft delete, data pendaftar tetap tersimpan. */
const deleteTarget = ref<IPeriodRow | null>(null);
const deleteDialogOpen = ref(false);
const isDeleting = ref(false);

const deleteDescription = computed<string>(() => {
    const name = deleteTarget.value?.name;
    const base = 'Data pendaftar tetap tersimpan; periode hanya diarsipkan.';
    return name ? `Periode “${name}” akan dihapus dari daftar. ${base}` : base;
});

function startDelete(period: IPeriodRow): void {
    deleteTarget.value = period;
    deleteDialogOpen.value = true;
}

function cancelDelete(): void {
    if (isDeleting.value) return;
    deleteDialogOpen.value = false;
    deleteTarget.value = null;
}

function confirmDelete(): void {
    const target: IPeriodRow | null = deleteTarget.value;
    if (!target || isDeleting.value) return;
    isDeleting.value = true;
    router.delete(routes.admin.recruitment.periods.destroy(target.id), {
        preserveScroll: true,
        onError: () => showErrorToast('Gagal menghapus periode recruitment.'),
        onFinish: () => {
            isDeleting.value = false;
            deleteDialogOpen.value = false;
            deleteTarget.value = null;
        },
    });
}

onMounted(() => {
    setTopbar({ title: 'Rekrutmen', subtitle: 'OpenRecruitment DOSCOM' });
});
</script>

<template>
    <Head title="Rekrutmen" />

    <div class="flex w-full max-w-full min-w-0 flex-col gap-6 pt-0 pb-8 sm:gap-8 sm:pb-10">
        <!-- Perlu tindakan (di atas: prioritas utama halaman) -->
        <section v-if="canManagePeriods && summary.active_period && !isLoadingPeriods" aria-label="Perlu tindakan">
            <h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Perlu tindakan</h2>
            <div v-if="actionQueues.length > 0" class="fade-up grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                    v-for="queue in actionQueues"
                    :key="`${queue.key}-${queue.label}`"
                    :href="applicationsQueueUrl(queue.key)"
                    class="group rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3">
                            <div
                                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700"
                            >
                                <ClipboardList class="size-4" />
                            </div>
                            <div>
                                <p class="font-medium group-hover:text-primary">{{ queue.label }}</p>
                                <p class="mt-0.5 text-sm text-muted-foreground">{{ queue.description }}</p>
                            </div>
                        </div>
                        <Badge variant="secondary" class="shrink-0 text-base font-semibold tabular-nums">
                            {{ queue.count ?? 0 }}
                        </Badge>
                    </div>
                </Link>
            </div>
        </section>

        <!-- Daftar periode (kartu per-periode) -->
        <section v-if="canManagePeriods || periodRows.length > 0" aria-label="Daftar periode">
            <h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Daftar periode</h2>

            <div class="mb-4 flex flex-wrap items-center gap-3">
                <Input
                    v-model="periodSearch"
                    placeholder="Cari nama periode..."
                    class="min-w-0 flex-1 sm:max-w-xs sm:flex-none"
                />
                <SearchableSelect
                    v-model="periodStatus"
                    :options="periodStatusOptions"
                    id="filter-status"
                    class="h-10 w-full border-border/80 bg-background/80 text-xs sm:w-44 sm:text-sm"
                    aria-label="Filter status periode"
                />
                <Button variant="outline" size="sm" class="sm:ml-auto" @click="openDivisionDrawer">
                    <Layers class="mr-2 size-4" />
                    Divisi
                </Button>
                <Button v-if="canManagePeriods" as-child size="sm" class="shadow-sm">
                    <Link :href="routes.admin.recruitment.periods.create">
                        <CalendarRange class="mr-2 size-4" />
                        Periode baru
                    </Link>
                </Button>
            </div>

            <div
                v-if="isLoadingPeriods"
                class="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3"
                aria-busy="true"
                aria-label="Memuat periode"
            >
                <div
                    v-for="n in 6"
                    :key="`periode-${n}`"
                    class="period-card-skeleton flex flex-col rounded-2xl border border-border/70 shadow-xs"
                >
                    <div class="flex flex-1 flex-col gap-4 px-5 pt-4 pb-3">
                        <Skeleton class="aspect-video w-full" />
                        <div class="flex items-start justify-between gap-x-3 gap-y-2">
                            <Skeleton class="h-5 min-w-0 flex-1" />
                            <Skeleton class="h-6 w-16 shrink-0" />
                        </div>
                        <div class="space-y-2">
                            <Skeleton class="h-4 w-3/4" />
                            <Skeleton class="h-4 w-1/2" />
                        </div>
                        <div class="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
                            <Skeleton class="h-8 w-20" />
                            <Skeleton class="h-8 w-16" />
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-else-if="periodRows.length > 0"
                class="fade-up grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
                <Card
                    v-for="period in periodRows"
                    :key="period.id"
                    class="flex flex-col rounded-2xl border-border/70 shadow-xs transition-colors hover:border-primary/40"
                >
                    <CardContent class="flex flex-1 flex-col gap-4 px-5 pt-4 pb-3">
                        <div
                            class="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted"
                        >
                            <img
                                v-if="period.banner_url"
                                :src="period.banner_url"
                                :alt="`Banner ${period.name}`"
                                loading="lazy"
                                decoding="async"
                                class="absolute inset-0 size-full object-cover"
                            />
                            <div
                                v-else
                                class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground"
                                aria-hidden="true"
                            >
                                <ImageOff class="size-6 opacity-50" :stroke-width="1.8" />
                                <span class="text-[11px] font-medium">Tanpa banner</span>
                            </div>
                        </div>
                        <div class="flex items-start justify-between gap-x-3 gap-y-2">
                            <p
                                class="line-clamp-2 min-w-0 flex-1 text-base leading-snug font-semibold tracking-tight text-pretty break-words"
                            >
                                {{ period.name }}
                            </p>
                            <Badge :class="cn('shrink-0 border', periodStatusClass(period.status))">
                                {{ period.status_label }}
                            </Badge>
                        </div>
                        <div class="space-y-2 text-sm leading-relaxed text-muted-foreground">
                            <p class="flex items-center gap-2.5">
                                <CalendarRange class="size-4 shrink-0 opacity-70" aria-hidden="true" />
                                <span v-if="period.registration_opens_at" class="tabular-nums">
                                    {{ period.registration_opens_at?.slice(0, 10) }}
                                    —
                                    {{ period.registration_closes_at?.slice(0, 10) ?? '…' }}
                                </span>
                                <span v-else>Jadwal pendaftaran belum ditentukan</span>
                            </p>
                            <p class="flex items-center gap-2.5">
                                <Users class="size-4 shrink-0 opacity-70" aria-hidden="true" />
                                <span class="tabular-nums"> {{ period.applications_count }} applicant </span>
                            </p>
                        </div>
                        <div class="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
                            <div v-if="period.creator" class="mr-auto flex min-w-0 items-center gap-2">
                                <img
                                    v-if="period.creator.avatar_url"
                                    :src="period.creator.avatar_url"
                                    :alt="period.creator.name"
                                    loading="lazy"
                                    class="size-6 shrink-0 rounded-full border border-border/60 object-cover"
                                />
                                <span
                                    v-else
                                    class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                    aria-hidden="true"
                                >
                                    <User class="size-3.5" />
                                </span>
                                <span class="max-w-36 min-w-0 truncate text-xs text-muted-foreground">
                                    {{ period.creator.name }}
                                </span>
                            </div>
                            <div class="ml-auto flex flex-wrap items-center gap-2">
                                <Button as-child variant="outline" size="sm">
                                    <Link :href="routes.admin.recruitment.periods.show(period.id)"> Detail </Link>
                                </Button>
                                <Button v-if="canManagePeriods || period.can_edit" as-child variant="ghost" size="sm">
                                    <Link :href="routes.admin.recruitment.periods.edit(period.id)"> Edit </Link>
                                </Button>
                                <Button
                                    v-if="period.can_delete"
                                    variant="destructive-ghost"
                                    size="sm"
                                    @click="startDelete(period)"
                                >
                                    <Trash2 class="mr-1.5 size-4" aria-hidden="true" />
                                    Hapus
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <EmptyState v-else title="Belum ada periode recruitment." animation-name="emptyData" />

            <div v-if="periodLastPage > 1 && !isLoadingPeriods" class="mt-4 flex justify-center gap-2">
                <DataPagination
                    :numbers="false"
                    :page="periodCurrentPage"
                    :page-count="periodLastPage"
                    @update:page="applyPeriodFilters"
                />
                <span class="self-center text-xs text-muted-foreground tabular-nums">
                    {{ periodCurrentPage }} / {{ periodLastPage }} · {{ periodTotal }} periode
                </span>
            </div>
        </section>

        <!-- Today's interview sessions -->
        <section v-if="todaySessions.length > 0 && !isLoadingPeriods">
            <h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Interview hari ini</h2>
            <div class="fade-up grid gap-3">
                <Card v-for="session in todaySessions" :key="session.id" class="rounded-2xl border-border/70">
                    <CardContent class="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div>
                            <p class="font-medium">
                                {{ session.division?.name ?? 'Interview' }}
                                · {{ session.starts_at }}–{{ session.ends_at }}
                            </p>
                            <p class="text-sm text-muted-foreground">
                                {{ session.location }} · {{ session.room }} · {{ session.interviews_count }} terjadwal
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <Button as-child variant="outline" size="sm">
                                <Link :href="routes.admin.recruitment.interviewSessions.show(session.id)">
                                    Kelola sesi
                                </Link>
                            </Button>
                            <Button v-if="canViewQueue" as-child size="sm">
                                <Link :href="routes.admin.recruitment.queue.show(session.id)">
                                    <ListOrdered class="mr-2 size-4" />
                                    Antrean
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <!-- Quick access when no queues -->
        <div
            v-if="actionQueues.length === 0 && (canManagePeriods || canScheduleInterviews) && !isLoadingPeriods"
            class="fade-up grid gap-3 sm:grid-cols-2"
        >
            <Card v-if="canManagePeriods" class="rounded-2xl border-dashed border-border/70">
                <CardContent class="flex items-center justify-between gap-4 p-5">
                    <div class="flex items-center gap-3">
                        <Users class="size-5 text-muted-foreground" />
                        <div>
                            <p class="font-medium">Semua applicant</p>
                            <p class="text-sm text-muted-foreground">Tidak ada antrean tindakan saat ini.</p>
                        </div>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link :href="quickApplicantHref">Buka</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card v-if="canScheduleInterviews" class="rounded-2xl border-dashed border-border/70">
                <CardContent class="flex items-center justify-between gap-4 p-5">
                    <div>
                        <p class="font-medium">Sesi interview</p>
                        <p class="text-sm text-muted-foreground">Jadwalkan applicant yang lolos screening.</p>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link :href="quickInterviewHref">Buka</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
        <!-- Skeleton zona daftar selama partial visit (pola M2 Task 1) -->
        <div
            v-if="isLoadingPeriods"
            class="flex w-full max-w-full min-w-0 flex-col gap-6"
            aria-busy="true"
            aria-label="Memuat rekrutmen"
        >
            <section
                v-if="canManagePeriods && summary.active_period && actionQueues.length > 0"
                aria-label="Perlu tindakan"
            >
                <h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Perlu tindakan</h2>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="n in 3"
                        :key="`antrean-${n}`"
                        class="queue-skeleton rounded-2xl border border-border/70 bg-card p-5"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                                <Skeleton class="size-9 shrink-0 rounded-lg" />
                                <div class="space-y-2">
                                    <Skeleton class="h-4 w-32" />
                                    <Skeleton class="h-3 w-44" />
                                </div>
                            </div>
                            <Skeleton class="h-7 w-10 shrink-0" />
                        </div>
                    </div>
                </div>
            </section>

            <section v-if="todaySessions.length > 0" aria-label="Interview hari ini">
                <h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    Interview hari ini
                </h2>
                <div class="grid gap-3">
                    <div v-for="n in 2" :key="`sesi-${n}`" class="session-skeleton rounded-2xl border border-border/70">
                        <div class="flex flex-wrap items-center justify-between gap-4 p-5">
                            <div class="min-w-0 flex-1 space-y-2">
                                <Skeleton class="h-4 w-1/2" />
                                <Skeleton class="h-3 w-2/3" />
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <Skeleton class="h-8 w-24" />
                                <Skeleton class="h-8 w-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div
                v-if="actionQueues.length === 0 && (canManagePeriods || canScheduleInterviews)"
                class="grid gap-3 sm:grid-cols-2"
                aria-label="Akses cepat"
            >
                <div
                    v-for="n in 2"
                    :key="`cepat-${n}`"
                    class="quick-skeleton rounded-2xl border border-dashed border-border/70"
                >
                    <div class="flex items-center justify-between gap-4 p-5">
                        <div class="flex items-center gap-3">
                            <Skeleton class="size-5 shrink-0" />
                            <div class="space-y-2">
                                <Skeleton class="h-4 w-32" />
                                <Skeleton class="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton class="h-8 w-16 shrink-0" />
                    </div>
                </div>
            </div>
        </div>
        <DivisionListSheet :open="divisionDrawerOpen" :divisions="divisionRows" @close="closeDivisionDrawer" />

        <ConfirmationModal
            :open="deleteDialogOpen"
            title="Hapus periode recruitment?"
            :description="deleteDescription"
            confirm-text="Hapus"
            cancel-text="Batal"
            variant="destructive"
            :loading="isDeleting"
            @confirm="confirmDelete"
            @cancel="cancelDelete"
            @update:open="
                (v: boolean) => {
                    deleteDialogOpen = v;
                }
            "
        />
    </div>
</template>
