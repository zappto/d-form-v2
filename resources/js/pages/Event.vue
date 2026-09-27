<script setup lang="ts">
import LandingLayout from '@/layouts/LandingLayout.vue';
import SeoHead from '@/components/seo/SeoHead.vue';
import type { TJsonLd } from '@/components/seo/SeoHead.vue';
import EventHero from '@/components/modules/landing/events/EventHero.vue';
import EventHighlight from '@/components/modules/landing/events/EventHighlight.vue';
import EventList from '@/components/modules/landing/events/EventList.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import type { ISharedSeoProps } from '@/types/seo';
import { routes } from '@/lib/routes';

const props = defineProps<{
    events: IEvent[] | undefined;
}>();

const page = usePage();
const seo = computed(() => (page.props as { seo: ISharedSeoProps }).seo);

const listDescription = computed(
    () =>
        'Daftar acara terpublikasi: jelajahi workshop, seminar, dan kompetisi. Daftar sebagai peserta dalam beberapa langkah.'
);

const jsonLd = computed<TJsonLd[]>((): TJsonLd[] => {
    const base = seo.value.siteUrl;
    const items = (props.events ?? []).slice(0, 24).map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
            '@type': 'Event',
            name: e.title,
            url: `${base}${routes.landing.events.show(e.slug)}`,
            startDate: e.start_date,
            location: {
                '@type': 'Place',
                name: e.location,
                address: e.location,
            },
        },
    }));
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Acara',
            description: listDescription.value,
            url: `${base}${routes.landing.events.index}`,
            isPartOf: {
                '@type': 'WebSite',
                name: seo.value.siteName,
                url: `${base}${routes.home}`,
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: items,
            numberOfItems: items.length,
        },
    ];
});
</script>

<template>
    <LandingLayout>
        <SeoHead
            title="Acara"
            :description="listDescription"
            :canonical-path="routes.landing.events.index"
            :json-ld="jsonLd"
        />
        <EventHero />
        <div v-if="!events" aria-busy="true" aria-label="Memuat acara">
            <section class="bg-muted/30 py-24 md:py-32">
                <div class="mx-auto max-w-7xl px-6 lg:px-10">
                    <div class="mx-auto mb-14 max-w-2xl text-center">
                        <Skeleton class="mx-auto h-3 w-24" />
                        <Skeleton class="mx-auto mt-3 h-8 w-2/3" />
                        <Skeleton class="mx-auto mt-3 h-4 w-full max-w-lg" />
                    </div>

                    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-for="n in 3"
                            :key="`sorot-${n}`"
                            class="highlight-card-skeleton gap-0 overflow-hidden rounded-xl border border-border/40 bg-card"
                        >
                            <Skeleton class="aspect-[16/9] w-full rounded-none" />
                            <div class="p-5">
                                <div class="flex items-center justify-between gap-2">
                                    <Skeleton class="h-5 w-2/3" />
                                    <Skeleton class="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton class="mt-3 h-3 w-1/2" />
                                <Skeleton class="mt-4 h-9 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section aria-label="Daftar acara" class="py-24 md:py-32">
                <div class="mx-auto max-w-7xl px-6 lg:px-10">
                    <div class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Skeleton class="h-3 w-28" />
                            <Skeleton class="mt-3 h-8 w-56" />
                        </div>
                        <Skeleton class="h-10 w-full max-w-xs" />
                    </div>

                    <div class="flex flex-col gap-3">
                        <div
                            v-for="n in 5"
                            :key="`baris-${n}`"
                            class="event-row-skeleton block rounded-xl border border-border/40 bg-card"
                        >
                            <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                                <Skeleton class="h-20 w-full shrink-0 rounded-lg sm:h-16 sm:w-28" />
                                <div class="min-w-0 flex-1 space-y-2">
                                    <div class="flex items-start gap-3">
                                        <Skeleton class="h-4 min-w-0 flex-1" />
                                        <Skeleton class="h-5 w-16 shrink-0 rounded-full" />
                                    </div>
                                    <Skeleton class="h-3 w-2/3" />
                                </div>
                                <Skeleton class="hidden size-4 shrink-0 sm:block" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        <template v-else>
            <EventHighlight :events="events" />
            <EventList :events="events" />
        </template>
    </LandingLayout>
</template>
