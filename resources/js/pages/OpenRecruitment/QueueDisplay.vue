<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import axios from 'axios';
import LandingLayout from '@/layouts/LandingLayout.vue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SearchableSelect, { type SearchableSelectOption } from '@/components/core/SearchableSelect.vue';
import { Megaphone, WifiOff } from 'lucide-vue-next';
import { padQueueNumber } from '@/lib/format';
import { jsonRequestHeaders } from '@/lib/jsonRequest';

defineOptions({ layout: LandingLayout });

interface IQueueDisplayEntry {
    queue_number: number;
    display_name: string;
    division?: string | null;
    room?: string | null;
    status: string;
    status_label?: string | null;
    called_at?: string | null;
}

interface IQueueDisplaySession {
    name?: string | null;
    division?: string | null;
    room?: string | null;
    time?: string | null;
}

interface IQueueDisplayStats {
    waiting?: number | null;
    called?: number | null;
    completed?: number | null;
    total?: number | null;
}

interface IQueueDisplaySnapshot {
    session?: IQueueDisplaySession | null;
    entries?: IQueueDisplayEntry[] | null;
    current?: IQueueDisplayEntry | null;
    next?: IQueueDisplayEntry | null;
    stats?: IQueueDisplayStats | null;
}

/** Interval polling papan antrean publik (ms); endpoint `publicSnapshot()` tersanitasi tanpa auth, 15 dtk lebih hemat beban. */
const PUBLIC_DISPLAY_POLL_INTERVAL_MS = 15_000;

const props = defineProps<{
    snapshot: IQueueDisplaySnapshot;
    pollUrl?: string | null;
}>();

const live = ref<IQueueDisplaySnapshot>(props.snapshot);
const loadError = ref<boolean>(false);
const isOffline = ref<boolean>(false);
const lastUpdatedAt = ref<Date | null>(null);
/** Tick pertama (refresh awal) → skeleton; tick berikut diam. Sekali false, tak pernah true lagi. */
const isInitialLoading = ref<boolean>(false);

const divisionFilter = ref<string>('');
const roomFilter = ref<string>('');
const statusFilter = ref<string>('');

let pollTimer: ReturnType<typeof setInterval> | null = null;
let isRefreshing = false;

/** Label nomor antrean papan display; kosong menjadi #- mengikuti helper. */
function queueNumberLabel(value: number | null | undefined): string {
    return `#${padQueueNumber(value)}`;
}

function entryStatusLabel(entry: IQueueDisplayEntry): string {
    return entry.status_label?.trim() || entry.status || '—';
}

const entries = computed<IQueueDisplayEntry[]>(() => live.value.entries ?? []);

function uniqueOptions(values: (string | null | undefined)[], allLabel: string): SearchableSelectOption[] {
    const seen = new Map<string, string>();
    for (const raw of values) {
        const value = (raw ?? '').trim();
        if (value !== '' && !seen.has(value)) seen.set(value, value);
    }
    return [{ value: '', label: allLabel }, ...[...seen.entries()].map(([value, label]) => ({ value, label }))];
}

const divisionOptions = computed<SearchableSelectOption[]>(() =>
    uniqueOptions(
        entries.value.map((e) => e.division),
        'Semua divisi'
    )
);

const roomOptions = computed<SearchableSelectOption[]>(() =>
    uniqueOptions(
        entries.value.map((e) => e.room),
        'Semua ruang'
    )
);

const statusOptions = computed<SearchableSelectOption[]>(() => {
    const seen = new Map<string, string>();
    for (const entry of entries.value) {
        const value = (entry.status ?? '').trim();
        if (value !== '' && !seen.has(value)) seen.set(value, entryStatusLabel(entry));
    }
    return [{ value: '', label: 'Semua status' }, ...[...seen.entries()].map(([value, label]) => ({ value, label }))];
});

const filteredEntries = computed<IQueueDisplayEntry[]>(() =>
    entries.value.filter((entry) => {
        if (divisionFilter.value !== '' && (entry.division ?? '').trim() !== divisionFilter.value) return false;
        if (roomFilter.value !== '' && (entry.room ?? '').trim() !== roomFilter.value) return false;
        if (statusFilter.value !== '' && (entry.status ?? '').trim() !== statusFilter.value) return false;
        return true;
    })
);

const lastUpdatedLabel = computed<string>(() => {
    if (lastUpdatedAt.value === null) return 'Menampilkan data awal';
    return `Diperbarui ${lastUpdatedAt.value.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })}`;
});

async function refreshDisplay(): Promise<void> {
    if (isRefreshing || !props.pollUrl) return;
    isRefreshing = true;
    try {
        const response = await axios.get<IQueueDisplaySnapshot>(props.pollUrl, {
            headers: jsonRequestHeaders(),
        });
        live.value = response.data;
        loadError.value = false;
        lastUpdatedAt.value = new Date();
    } catch {
        loadError.value = true;
    } finally {
        isRefreshing = false;
        isInitialLoading.value = false;
    }
}

/** Skeleton hanya bila tick pertama belum selesai DAN belum ada data awal. */
const hasDisplayData = computed<boolean>(
    () =>
        (live.value.entries?.length ?? 0) > 0 ||
        (live.value.current ?? null) !== null ||
        (live.value.next ?? null) !== null
);
const showDisplaySkeleton = computed<boolean>(() => isInitialLoading.value && !hasDisplayData.value);

function startPolling(): void {
    if (pollTimer !== null || !props.pollUrl) return;
    pollTimer = setInterval((): void => {
        void refreshDisplay();
    }, PUBLIC_DISPLAY_POLL_INTERVAL_MS);
}

function stopPolling(): void {
    if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

function handleVisibilityChange(): void {
    if (document.hidden) {
        stopPolling();
        return;
    }
    void refreshDisplay();
    startPolling();
}

function handleOnline(): void {
    isOffline.value = false;
    void refreshDisplay();
}

function handleOffline(): void {
    isOffline.value = true;
}

onMounted((): void => {
    isOffline.value = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (props.pollUrl) {
        isInitialLoading.value = true;
        void refreshDisplay();
    }
    startPolling();
});

onUnmounted((): void => {
    stopPolling();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
});
</script>

<template>
    <Head title="Papan Antrean Interview" />

    <div class="relative">
        <section
            aria-label="Informasi sesi"
            class="border-b border-border/30 bg-muted/20 pt-28 pb-8 sm:pt-32 sm:pb-10 lg:pb-12"
        >
            <div class="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-10">
                <p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase sm:text-sm">
                    OpenRecruitment DOSCOM · Papan antrean
                </p>
                <h1
                    class="mt-3 font-display text-2xl font-bold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
                >
                    <template v-if="!showDisplaySkeleton">
                        {{ live.session?.name?.trim() || 'Antrean interview' }}
                    </template>
                    <Skeleton v-else class="mx-auto h-10 w-2/3 sm:h-12" />
                </h1>
                <p class="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    <template v-if="!showDisplaySkeleton">
                        {{
                            [live.session?.time, live.session?.room]
                                .filter((v) => (v ?? '').trim() !== '')
                                .join(' · ') || '—'
                        }}
                    </template>
                    <Skeleton v-else class="mx-auto h-4 w-1/3" />
                </p>
            </div>
        </section>

        <div class="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20 lg:px-10 lg:pb-24">
            <div
                v-if="isOffline || loadError"
                role="alert"
                class="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
                <p class="flex items-center gap-2 font-medium">
                    <WifiOff class="size-4 shrink-0" aria-hidden="true" />
                    {{
                        isOffline
                            ? 'Koneksi terputus. Data terakhir tetap ditampilkan.'
                            : 'Gagal memperbarui antrean. Data terakhir tetap ditampilkan.'
                    }}
                </p>
            </div>

            <section aria-label="Sedang dipanggil" class="mb-6 sm:mb-8">
                <Card class="rounded-2xl border-border/70">
                    <CardContent class="p-6 text-center sm:p-10">
                        <p
                            class="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase sm:text-sm"
                        >
                            <Megaphone class="size-4 sm:size-5" aria-hidden="true" />
                            Sedang dipanggil
                        </p>
                        <div
                            v-if="showDisplaySkeleton"
                            aria-busy="true"
                            aria-label="Memuat antrean"
                            class="display-hero-skeleton"
                        >
                            <Skeleton class="mx-auto mt-4 h-20 w-40 sm:h-24" />
                            <Skeleton class="mx-auto mt-3 h-8 w-2/3 sm:w-1/2" />
                            <Skeleton class="mx-auto mt-2 h-4 w-1/3" />
                        </div>
                        <div v-else-if="live.current" class="fade-up">
                            <p
                                aria-live="polite"
                                class="mt-4 text-7xl font-bold tracking-tight tabular-nums sm:text-8xl lg:text-9xl"
                            >
                                {{ queueNumberLabel(live.current.queue_number) }}
                            </p>
                            <p class="mt-3 text-2xl font-semibold sm:text-4xl">
                                {{ live.current.display_name?.trim() || '—' }}
                            </p>
                            <p
                                v-if="(live.current.division ?? '').trim() !== ''"
                                class="mt-2 text-sm text-muted-foreground sm:text-base"
                            >
                                {{ live.current.division }}
                            </p>
                        </div>
                        <p v-else class="mt-6 text-lg text-muted-foreground sm:text-2xl">Belum ada yang dipanggil.</p>
                    </CardContent>
                </Card>
            </section>

            <section v-if="showDisplaySkeleton" aria-label="Berikutnya" class="mb-6 sm:mb-8">
                <Card class="rounded-2xl border-border/70 bg-muted/40">
                    <CardContent
                        class="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 p-5 text-center sm:p-6"
                    >
                        <Skeleton class="h-4 w-24" />
                        <Skeleton class="h-10 w-20" />
                        <Skeleton class="h-7 w-40" />
                    </CardContent>
                </Card>
            </section>

            <section v-else-if="live.next" aria-label="Berikutnya" class="fade-up mb-6 sm:mb-8">
                <Card class="rounded-2xl border-border/70 bg-muted/40">
                    <CardContent
                        class="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 p-5 text-center sm:p-6"
                    >
                        <p class="text-xs font-semibold tracking-widest text-muted-foreground uppercase sm:text-sm">
                            Berikutnya
                        </p>
                        <p class="text-3xl font-bold tabular-nums sm:text-5xl">
                            {{ queueNumberLabel(live.next.queue_number) }}
                        </p>
                        <p class="text-lg font-medium sm:text-2xl">
                            {{ live.next.display_name?.trim() || '—' }}
                        </p>
                    </CardContent>
                </Card>
            </section>

            <section aria-label="Daftar antrean">
                <div class="mb-4 flex flex-wrap items-end gap-3">
                    <div class="min-w-36 flex-1">
                        <SearchableSelect
                            v-model="divisionFilter"
                            :options="divisionOptions"
                            placeholder="Semua divisi"
                            aria-label="Filter divisi"
                        />
                    </div>
                    <div class="min-w-36 flex-1">
                        <SearchableSelect
                            v-model="roomFilter"
                            :options="roomOptions"
                            placeholder="Semua ruang"
                            aria-label="Filter ruang"
                        />
                    </div>
                    <div class="min-w-36 flex-1">
                        <SearchableSelect
                            v-model="statusFilter"
                            :options="statusOptions"
                            placeholder="Semua status"
                            aria-label="Filter status"
                        />
                    </div>
                </div>

                <Card class="rounded-2xl border-border/70">
                    <CardContent class="p-2 sm:p-4">
                        <div v-if="showDisplaySkeleton" aria-busy="true" aria-label="Memuat daftar antrean">
                            <ul class="divide-y divide-border/60">
                                <li
                                    v-for="n in 6"
                                    :key="`display-skel-${n}`"
                                    class="display-row-skeleton flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4"
                                >
                                    <Skeleton class="h-7 w-14 shrink-0 sm:h-8 sm:w-20" />
                                    <span class="min-w-0 flex-1 space-y-1.5">
                                        <Skeleton class="h-4 w-2/3 sm:h-5" />
                                        <Skeleton class="h-3 w-1/3" />
                                    </span>
                                    <Skeleton class="h-6 w-20 shrink-0 rounded-full" />
                                </li>
                            </ul>
                        </div>
                        <ul v-else-if="filteredEntries.length > 0" class="fade-up divide-y divide-border/60">
                            <li
                                v-for="entry in filteredEntries"
                                :key="`${entry.queue_number}-${entry.display_name}`"
                                class="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4"
                            >
                                <span class="w-14 shrink-0 text-xl font-bold tabular-nums sm:w-20 sm:text-2xl">
                                    {{ queueNumberLabel(entry.queue_number) }}
                                </span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-base font-medium sm:text-lg">
                                        {{ entry.display_name?.trim() || '—' }}
                                    </span>
                                    <span
                                        v-if="(entry.division ?? '').trim() !== ''"
                                        class="block truncate text-xs text-muted-foreground sm:text-sm"
                                    >
                                        {{ entry.division }}
                                    </span>
                                </span>
                                <Badge variant="outline" class="shrink-0">
                                    {{ entryStatusLabel(entry) }}
                                </Badge>
                            </li>
                        </ul>
                        <p v-else class="px-4 py-8 text-center text-sm text-muted-foreground sm:text-base">
                            Belum ada antrean untuk filter ini.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <p class="mt-6 text-center text-xs text-muted-foreground sm:text-sm">
                {{ lastUpdatedLabel }} · Memperbarui otomatis setiap 15 detik.
            </p>
        </div>
    </div>
</template>
