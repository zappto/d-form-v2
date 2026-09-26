<script setup lang="ts">
import { reactive, computed } from 'vue'
import { Head } from '@inertiajs/vue3'
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue'
import ConfirmationModal from '@/components/core/ConfirmationModal.vue'
import EventShowHeroSection from '@/components/modules/dashboard/EventShowHeroSection.vue'
import EventShowRegistrationPulseCard from '@/components/modules/dashboard/EventShowRegistrationPulseCard.vue'
import EventShowAboutCard from '@/components/modules/dashboard/EventShowAboutCard.vue'
import EventShowRegistrantsPreviewCard from '@/components/modules/dashboard/EventShowRegistrantsPreviewCard.vue'
import EventShowAsideRail from '@/components/modules/dashboard/EventShowAsideRail.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardEventShowPage } from '@/hooks/useDashboardEventShowPage'
import { routes } from '@/lib/routes'

defineOptions({ layout: DashboardFocusLayout })

const props = defineProps<{
    event: IEvent | undefined
    forms: { id: string; title: string }[] | undefined
}>()

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const eventReady = computed<boolean>(() => props.event !== undefined)

/** Fallback agar composable tidak membaca props yang belum ada (tak pernah tampil). */
const EMPTY_EVENT: IEvent = {
    id: '',
    slug: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    location: '',
    quota: 0,
    registered_count: 0,
    banner: '',
    banner_url: null,
    price: 0,
    session: [],
    category: [],
    status: 'draft',
    registration_status: 'not_yet_open',
    deleted_at: null,
    created_at: '',
    updated_at: '',
}

/** Event yang pasti terdefinisi di cabang konten (eventReady true). */
const readyEvent = computed<IEvent>(() => props.event ?? EMPTY_EVENT)

const laporanHref = computed<string>(() =>
    props.event ? routes.admin.events.laporan(props.event.id) : '',
)

const p = reactive(useDashboardEventShowPage(props.event ?? EMPTY_EVENT, props.forms ?? []))
</script>

<template>
    <Head :title="props.event?.title ?? 'Detail acara'" />
    <TooltipProvider :delay-duration="150">
        <div v-if="!eventReady" class="flex min-w-0 flex-col gap-6 pb-6 sm:gap-8" aria-busy="true" aria-label="Memuat detail acara">
            <section class="hero-skeleton overflow-hidden rounded-2xl border border-border/60 bg-card">
                <div class="grid min-w-0 grid-cols-1 lg:grid-cols-12 lg:items-stretch">
                    <Skeleton class="relative aspect-[16/9] w-full rounded-none lg:col-span-5 lg:aspect-auto lg:h-full lg:min-h-[292px]" />
                    <div class="flex min-w-0 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-7 sm:py-7 lg:col-span-7 lg:px-8 lg:py-8">
                        <div class="flex min-w-0 flex-col gap-4">
                            <div class="flex flex-wrap items-center gap-2">
                                <Skeleton class="h-6 w-20 rounded-full" />
                                <Skeleton class="h-6 w-24 rounded-full" />
                            </div>
                            <div class="space-y-2">
                                <Skeleton class="h-8 w-3/4" />
                                <Skeleton class="h-4 w-1/2" />
                            </div>
                        </div>
                        <div class="grid min-w-0 gap-2.5 sm:grid-cols-2 sm:gap-3">
                            <div v-for="n in 4" :key="`meta-${n}`" class="space-y-1.5">
                                <Skeleton class="h-3 w-16" />
                                <Skeleton class="h-4 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div class="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-3">
                <div class="order-2 flex min-w-0 flex-col gap-5 sm:gap-6 xl:order-1 xl:col-span-2">
                    <div v-for="n in 3" :key="`kiri-${n}`" class="detail-card-skeleton rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
                        <Skeleton class="h-5 w-40" />
                        <Skeleton class="mt-3 h-4 w-full" />
                        <Skeleton class="mt-2 h-4 w-2/3" />
                    </div>
                </div>

                <div class="aside-skeleton order-1 flex min-w-0 flex-col gap-5 xl:order-2">
                    <div class="rounded-2xl border border-border/60 bg-card p-4">
                        <Skeleton class="h-4 w-28" />
                        <div class="mt-3 flex flex-col gap-2">
                            <Skeleton class="h-10 w-full" />
                            <Skeleton class="h-10 w-full" />
                            <Skeleton class="h-10 w-full" />
                        </div>
                    </div>
                    <div class="rounded-2xl border border-border/60 bg-card p-4">
                        <Skeleton class="h-4 w-24" />
                        <div class="mt-3 flex flex-col gap-2">
                            <Skeleton class="h-9 w-full" />
                            <Skeleton class="h-9 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template v-else>
        <div class="fade-up flex min-w-0 flex-col gap-6 pb-6 sm:gap-8">
            <EventShowHeroSection
                :event="readyEvent"
                :status-pill="p.statusPill"
                :meta-blocks="p.metaBlocks"
                :card-shadow="p.cardShadow"
            />

            <div class="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-3">
                <div class="order-2 flex min-w-0 flex-col gap-5 sm:gap-6 xl:order-1 xl:col-span-2">
                    <EventShowRegistrationPulseCard
                        :event="readyEvent"
                        :fill-percent="p.fillPercent"
                        :remaining-seats="p.remainingSeats"
                        :progress-tone="p.progressTone"
                        :card-shadow="p.cardShadow"
                        :format-date-time="p.formatDateTime"
                    />
                    <EventShowAboutCard :event="readyEvent" :card-shadow="p.cardShadow" :format-date="p.formatDate" />
                    <EventShowRegistrantsPreviewCard
                        :event-id="readyEvent.id"
                        :total-registrants="p.totalRegistrants"
                        :preview-registrants="p.previewRegistrants"
                        :card-shadow="p.cardShadow"
                    />
                </div>

                <EventShowAsideRail
                    class="order-1 xl:order-2"
                    :event="readyEvent"
                    :forms="p.forms"
                    :card-shadow="p.cardShadow"
                    :laporan-href="laporanHref"
                    :is-toggling-publish="p.isTogglingPublish"
                    @open-archive="p.showDeleteModal = true"
                    @open-restore="p.showRestoreModal = true"
                    @toggle-publish="p.handleTogglePublish"
                />
            </div>
        </div>
        </template>
    </TooltipProvider>

    <ConfirmationModal
        :open="p.showDeleteModal"
        title="Archive this event?"
        description="It will be hidden from the public, but all registrant data stays intact. You can restore it whenever you’re ready."
        confirm-text="Archive"
        variant="destructive"
        :loading="p.isDeleting"
        @confirm="p.handleDelete"
        @cancel="p.showDeleteModal = false"
        @update:open="(v: boolean) => (p.showDeleteModal = v)"
    />
    <ConfirmationModal
        :open="p.showRestoreModal"
        title="Restore this event?"
        description="It will become visible again and accept registrations based on its current schedule."
        confirm-text="Restore"
        :loading="p.isRestoring"
        @confirm="p.handleRestore"
        @cancel="p.showRestoreModal = false"
        @update:open="(v: boolean) => (p.showRestoreModal = v)"
    />
</template>
