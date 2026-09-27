<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import axios from 'axios';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import EmptyState from '@/components/modules/dashboard/EmptyState.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CometSpinner } from '@/components/ui/comet';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/lib/routes';
import { padQueueNumber } from '@/lib/format';
import { jsonRequestHeaders } from '@/lib/jsonRequest';
import { setTopbar } from '@/hooks/useDashboardTopbar';
import { useRecruitmentQueue, type IQueueSnapshot } from '@/hooks/useRecruitmentQueue';
import { toast } from 'vue-sonner';

defineOptions({ layout: DashboardLayout });

interface SessionDetail {
    id: string;
    session_date: string;
    starts_at: string;
    ends_at: string;
    location: string;
    room: string;
    division: { name: string } | null;
    period: { name: string } | null;
}

const props = defineProps<{
    session: SessionDetail;
    queue: IQueueSnapshot;
    pollUrl: string;
    callNextUrl: string;
    completeUrlTemplate: string;
    canManage: boolean;
}>();

const { queue, refresh, isInitialLoading } = useRecruitmentQueue(props.pollUrl, props.queue);
const actionBusy = ref(false);

/** Skeleton hanya bila tick pertama belum selesai DAN belum ada data awal. */
const hasQueueData = computed<boolean>(
    () => queue.value.entries.length > 0 || queue.value.current !== null || queue.value.next !== null
);
const showQueueSkeleton = computed<boolean>(() => isInitialLoading.value && !hasQueueData.value);

onMounted(() => {
    setTopbar({
        title: 'Monitor antrean',
        subtitle: props.session.division?.name ?? '',
    });
    void refresh();
});

const completeUrlFor = (entryId: string) => props.completeUrlTemplate.replace('__ENTRY__', entryId);

async function callNext() {
    if (actionBusy.value || !props.canManage) {
        return;
    }

    actionBusy.value = true;

    try {
        const { data } = await axios.post(
            props.callNextUrl,
            {},
            {
                headers: jsonRequestHeaders(),
            }
        );
        queue.value = data.queue;
        toast.success(data.message ?? 'Aplikan dipanggil.');
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            toast.info('Tidak ada antrean menunggu.');
            await refresh();
        } else {
            toast.error('Gagal memanggil antrean berikutnya.');
        }
    } finally {
        actionBusy.value = false;
    }
}

async function completeEntry(entryId: string) {
    if (actionBusy.value || !props.canManage) {
        return;
    }

    actionBusy.value = true;

    try {
        const { data } = await axios.post(
            completeUrlFor(entryId),
            {},
            {
                headers: jsonRequestHeaders(),
            }
        );
        queue.value = data.queue;
        toast.success(data.message ?? 'Antrean selesai.');
    } catch {
        toast.error('Gagal menyelesaikan antrean.');
    } finally {
        actionBusy.value = false;
    }
}

const statusVariant = (status: string) => {
    if (status === 'called' || status === 'in_progress') return 'default';
    if (status === 'completed') return 'secondary';
    return 'outline';
};
</script>

<template>
    <Head title="Monitor Antrean Interview" />

    <div class="flex w-full max-w-full min-w-0 flex-col gap-6 pt-0 pb-8 sm:gap-8 sm:pb-10">
        <div class="flex flex-wrap items-center justify-end gap-3">
            <Button v-if="canManage" :disabled="actionBusy" :aria-busy="actionBusy" @click="callNext">
                <CometSpinner v-if="actionBusy" :size="16" />
                {{ actionBusy ? 'Memproses...' : 'Panggil berikutnya' }}
            </Button>
            <Button variant="outline" as-child>
                <Link :href="routes.admin.recruitment.interviewSessions.show(session.id)">Detail sesi</Link>
            </Button>
        </div>

        <div
            v-if="showQueueSkeleton"
            class="flex w-full max-w-full min-w-0 flex-col gap-6 sm:gap-8"
            aria-busy="true"
            aria-label="Memuat antrean"
        >
            <div class="grid gap-4 sm:grid-cols-4">
                <div
                    v-for="label in ['Total', 'Menunggu', 'Dipanggil', 'Selesai']"
                    :key="label"
                    class="queue-stat-skeleton rounded-xl border bg-card"
                >
                    <div class="flex flex-col space-y-1.5 p-4">
                        <Skeleton class="h-4 w-20" />
                    </div>
                    <div class="p-4 pt-0">
                        <Skeleton class="h-8 w-12" />
                    </div>
                </div>
            </div>

            <div class="fade-up grid gap-4 lg:grid-cols-2">
                <div
                    v-for="title in ['Sedang dilayani', 'Berikutnya']"
                    :key="title"
                    class="queue-card-skeleton rounded-xl border bg-card"
                >
                    <div class="flex flex-col space-y-1.5 p-4">
                        <Skeleton class="h-4 w-32" />
                    </div>
                    <div class="space-y-2 p-4 pt-0 text-center">
                        <Skeleton class="mx-auto h-9 w-24" />
                        <Skeleton class="mx-auto h-5 w-2/3" />
                        <Skeleton class="mx-auto h-4 w-1/3" />
                    </div>
                </div>
            </div>

            <div class="rounded-xl border bg-card">
                <div class="flex flex-col space-y-1.5 p-4">
                    <Skeleton class="h-4 w-36" />
                </div>
                <div class="p-4 pt-0">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b text-left">
                                    <th class="pr-4 pb-2">No.</th>
                                    <th class="pr-4 pb-2">Applicant</th>
                                    <th class="pr-4 pb-2">Status</th>
                                    <th v-if="canManage" class="pb-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="n in 6"
                                    :key="`antrean-skel-${n}`"
                                    class="queue-row-skeleton border-b border-border/50"
                                >
                                    <td class="py-3 pr-4">
                                        <Skeleton class="h-4 w-10" />
                                    </td>
                                    <td class="py-3 pr-4">
                                        <div class="space-y-1.5">
                                            <Skeleton class="h-4 w-32" />
                                            <Skeleton class="h-3 w-24" />
                                        </div>
                                    </td>
                                    <td class="py-3 pr-4">
                                        <Skeleton class="h-6 w-20 rounded-full" />
                                    </td>
                                    <td v-if="canManage" class="py-3">
                                        <Skeleton class="h-8 w-20" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <template v-else>
            <div class="fade-up grid gap-4 sm:grid-cols-4">
                <Card>
                    <CardHeader class="pb-2"><CardTitle class="text-sm font-medium">Total</CardTitle></CardHeader>
                    <CardContent
                        ><p class="text-2xl font-bold">{{ queue.stats.total }}</p></CardContent
                    >
                </Card>
                <Card>
                    <CardHeader class="pb-2"><CardTitle class="text-sm font-medium">Menunggu</CardTitle></CardHeader>
                    <CardContent
                        ><p class="text-2xl font-bold">{{ queue.stats.waiting }}</p></CardContent
                    >
                </Card>
                <Card>
                    <CardHeader class="pb-2"><CardTitle class="text-sm font-medium">Dipanggil</CardTitle></CardHeader>
                    <CardContent
                        ><p class="text-2xl font-bold">{{ queue.stats.called }}</p></CardContent
                    >
                </Card>
                <Card>
                    <CardHeader class="pb-2"><CardTitle class="text-sm font-medium">Selesai</CardTitle></CardHeader>
                    <CardContent
                        ><p class="text-2xl font-bold">{{ queue.stats.completed }}</p></CardContent
                    >
                </Card>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle class="text-base">Sedang dilayani</CardTitle></CardHeader>
                    <CardContent>
                        <template v-if="queue.current">
                            <p class="text-3xl font-bold">#{{ padQueueNumber(queue.current.queue_number) }}</p>
                            <p class="font-medium">{{ queue.current.application?.full_name }}</p>
                            <p class="text-sm text-muted-foreground">
                                {{ queue.current.application?.registration_number }}
                            </p>
                            <Button
                                v-if="canManage"
                                class="mt-3"
                                size="sm"
                                variant="secondary"
                                :disabled="actionBusy"
                                :aria-busy="actionBusy"
                                @click="completeEntry(queue.current.id)"
                            >
                                <CometSpinner v-if="actionBusy" :size="16" />
                                {{ actionBusy ? 'Memproses...' : 'Tandai selesai' }}
                            </Button>
                        </template>
                        <EmptyState v-else variant="inline" title="Belum ada yang dipanggil." />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle class="text-base">Berikutnya</CardTitle></CardHeader>
                    <CardContent>
                        <template v-if="queue.next">
                            <p class="text-3xl font-bold">#{{ padQueueNumber(queue.next.queue_number) }}</p>
                            <p class="font-medium">{{ queue.next.application?.full_name }}</p>
                            <p class="text-sm text-muted-foreground">
                                {{ queue.next.application?.registration_number }}
                            </p>
                        </template>
                        <EmptyState v-else variant="inline" title="Antrean kosong." />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle class="text-base">Daftar antrean</CardTitle></CardHeader>
                <CardContent>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b text-left">
                                    <th class="pr-4 pb-2">No.</th>
                                    <th class="pr-4 pb-2">Applicant</th>
                                    <th class="pr-4 pb-2">Status</th>
                                    <th v-if="canManage" class="pb-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="fade-up">
                                <tr v-for="entry in queue.entries" :key="entry.id" class="border-b border-border/50">
                                    <td class="py-3 pr-4 font-mono font-semibold">
                                        #{{ padQueueNumber(entry.queue_number) }}
                                    </td>
                                    <td class="py-3 pr-4">
                                        <p class="font-medium">{{ entry.application?.full_name ?? '—' }}</p>
                                        <p class="text-xs text-muted-foreground">
                                            {{ entry.application?.registration_number }}
                                        </p>
                                    </td>
                                    <td class="py-3 pr-4">
                                        <Badge :variant="statusVariant(entry.status)">{{ entry.status_label }}</Badge>
                                    </td>
                                    <td v-if="canManage" class="py-3">
                                        <Button
                                            v-if="entry.status === 'called' || entry.status === 'in_progress'"
                                            size="sm"
                                            variant="outline"
                                            :disabled="actionBusy"
                                            :aria-busy="actionBusy"
                                            @click="completeEntry(entry.id)"
                                        >
                                            <CometSpinner v-if="actionBusy" :size="16" />
                                            {{ actionBusy ? 'Memproses...' : 'Selesai' }}
                                        </Button>
                                    </td>
                                </tr>
                                <tr v-if="queue.entries.length === 0">
                                    <td colspan="4" class="py-6">
                                        <EmptyState variant="inline" title="Belum ada check-in." />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p class="mt-4 text-xs text-muted-foreground">Memperbarui otomatis setiap 10 detik.</p>
                </CardContent>
            </Card>
        </template>
    </div>
</template>
