<script setup lang="ts">
import { onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import EventDashboardForm from '@/components/modules/dashboard/events/EventDashboardForm.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { setTopbar } from '@/hooks/useDashboardTopbar';

defineOptions({ layout: DashboardFocusLayout });

defineProps<{
    event: IEvent | undefined;
    options:
        | { categories: { value: string; label: string }[]; sessions: { value: string; label: string }[] }
        | undefined;
}>();

onMounted(() => {
    setTopbar({ title: 'Ubah acara', subtitle: 'Perbarui detail — banner baru opsional' });
});
</script>

<template>
    <Head title="Ubah acara" />

    <div class="flex flex-col gap-8">
        <div v-if="!event || !options" aria-busy="true" aria-label="Memuat formulir acara">
            <div class="flex flex-col gap-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="space-y-1.5">
                        <Skeleton class="h-5 w-48" />
                        <Skeleton class="h-3 w-64 max-w-full" />
                    </div>
                    <Skeleton class="h-10 w-32" />
                </div>

                <div class="mb-5 grid gap-5 lg:grid-cols-12 lg:items-stretch">
                    <div class="edit-fields-skeleton flex flex-col gap-6 lg:col-span-7">
                        <div v-for="n in 4" :key="`field-${n}`" class="flex flex-col gap-5">
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center justify-between gap-3">
                                    <Skeleton class="h-4 w-32" />
                                    <Skeleton class="size-8 shrink-0" />
                                </div>
                                <Skeleton class="h-12 w-full rounded-xl" />
                                <Skeleton class="h-3 w-2/3" />
                            </div>
                        </div>
                    </div>

                    <div class="edit-preview-skeleton flex flex-col gap-8 lg:col-span-5">
                        <div class="rounded-2xl border border-border/70 bg-card p-5">
                            <Skeleton class="h-5 w-40" />
                            <Skeleton class="mt-3 h-4 w-full" />
                            <Skeleton class="mt-2 h-4 w-2/3" />
                            <div class="mt-4 overflow-hidden rounded-xl border border-border/60">
                                <Skeleton class="aspect-video w-full rounded-none" />
                            </div>
                            <Skeleton class="mt-4 h-10 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <EventDashboardForm v-else class="fade-up" variant="edit" :event="event" :options="options" />
    </div>
</template>
