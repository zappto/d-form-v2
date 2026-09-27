<script setup lang="ts">
import LandingLayout from '@/layouts/LandingLayout.vue';
import SeoHead from '@/components/seo/SeoHead.vue';
import type { TJsonLd } from '@/components/seo/SeoHead.vue';
import { computed, ref, onMounted } from 'vue';
import { usePage, Link } from '@inertiajs/vue3';
import { MapPin, CalendarDays, ArrowRight, Check, Shield } from 'lucide-vue-next';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryLabelMap, categoryColorMap, sessionLabelMap } from '@/lib/dummyData';
import { formatCountNumber, formatDisplayDate } from '@/lib/format';
import { toCategoryList } from '@/lib/eventCategories';
import { stripHtmlToText } from '@/utils/stripHtml';
import type { ISharedSeoProps } from '@/types/seo';
import { routes } from '@/lib/routes';
import { eventHeroBannerContainerClass } from '@/lib/eventBannerAspect';
import { eventStatusUi } from '@/lib/eventShowUi';

const props = defineProps<{
    event: IEvent | undefined;
    memberPortalEventUrl: string;
}>();

const page = usePage();
const seo = computed(() => (page.props as { seo: ISharedSeoProps }).seo);

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const eventReady = computed<boolean>(() => props.event !== undefined);

/** Fallback agar komputasi/SEO tak membaca props yang belum ada (tak pernah tampil). */
const EMPTY_EVENT_FALLBACK: IEvent = {
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
};

const event = computed<IEvent>(() => props.event ?? EMPTY_EVENT_FALLBACK);

const metaDescription = computed(() => {
    const plain = stripHtmlToText(event.value.description, 170);
    if (plain) {
        return plain;
    }
    return `${event.value.title} — ${formatDisplayDate(event.value.start_date)} · ${event.value.location}`;
});

const canonicalPath = computed(() => routes.landing.events.show(event.value.slug));

const eventJsonLd = computed<TJsonLd[]>(() => {
    const e = event.value;
    const base = seo.value.siteUrl;
    const pageUrl = `${base}${routes.landing.events.show(e.slug)}`;
    const images = e.banner_url ? [e.banner_url] : undefined;

    let availability = 'https://schema.org/InStock';
    if (e.registration_status === 'full') {
        availability = 'https://schema.org/SoldOut';
    }
    if (e.registration_status === 'closed' || e.registration_status === 'not_yet_open') {
        availability = 'https://schema.org/PreOrder';
    }

    const eventSchema: TJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: e.title,
        description: stripHtmlToText(e.description, 8000),
        startDate: e.start_date,
        endDate: e.end_date,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: e.location,
            address: e.location,
        },
        url: pageUrl,
        offers: {
            '@type': 'Offer',
            price: e.price,
            priceCurrency: 'IDR',
            availability,
            url: pageUrl,
        },
    };
    if (images) {
        eventSchema.image = images;
    }

    const crumbs: TJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${base}/` },
            { '@type': 'ListItem', position: 2, name: 'Acara', item: `${base}/events` },
            { '@type': 'ListItem', position: 3, name: e.title, item: pageUrl },
        ],
    };

    return [eventSchema, crumbs];
});

const visible = ref<boolean>(false);
onMounted(() => setTimeout(() => (visible.value = true), 100));

const capacityPercent = computed<number>(() => {
    if (event.value.quota <= 0) return 0;
    return Math.round((event.value.registered_count / event.value.quota) * 100);
});

const highlights: string[] = [
    'Expert-led sessions',
    'Hands-on exercises',
    'Certificate of completion',
    'Lifetime access to materials',
];
</script>

<template>
    <LandingLayout>
        <SeoHead
            :title="event.title"
            :description="metaDescription"
            :canonical-path="canonicalPath"
            :og-image="event.banner_url"
            og-type="website"
            :json-ld="eventJsonLd"
        />
        <section
            v-if="!eventReady"
            aria-busy="true"
            aria-label="Memuat detail acara"
            class="relative bg-background pt-20 sm:pt-24 lg:pt-20"
        >
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="rounded-[2rem] bg-muted/40 p-1.5 ring-1 ring-border/70 sm:p-2 lg:rounded-[2.25rem]">
                    <div
                        class="hero-skeleton overflow-hidden rounded-[calc(2rem-0.375rem)] border border-border/70 bg-card shadow-sm lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)]"
                    >
                        <Skeleton class="aspect-[16/9] w-full rounded-none lg:aspect-auto lg:h-full lg:min-h-[320px]" />
                        <div class="flex min-w-0 flex-col gap-5 p-5 sm:p-7 lg:p-9">
                            <div class="flex flex-wrap gap-2">
                                <Skeleton class="h-6 w-20 rounded-full" />
                                <Skeleton class="h-6 w-24 rounded-full" />
                            </div>
                            <Skeleton class="h-10 w-3/4" />
                            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <Skeleton class="h-20 w-full rounded-2xl" />
                                <Skeleton class="h-20 w-full rounded-2xl" />
                            </div>
                            <Skeleton class="h-24 w-full rounded-2xl" />
                            <Skeleton class="cta-skeleton h-[52px] w-full rounded-2xl" />
                        </div>
                    </div>
                </div>

                <div class="info-skeleton mt-8 grid gap-6 pb-14 sm:gap-8 sm:pb-20 lg:grid-cols-3 lg:gap-10">
                    <div class="order-2 space-y-6 lg:order-1 lg:col-span-2">
                        <div class="rounded-[1.5rem] border border-border bg-card p-5 sm:p-7">
                            <Skeleton class="h-8 w-1/2" />
                            <Skeleton class="mt-4 h-4 w-full" />
                            <Skeleton class="mt-2 h-4 w-full" />
                            <Skeleton class="mt-2 h-4 w-2/3" />
                        </div>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <Skeleton v-for="n in 4" :key="`sorot-${n}`" class="h-[68px] rounded-2xl" />
                        </div>
                    </div>
                    <div class="order-1 space-y-6 lg:order-2">
                        <div class="rounded-2xl border border-border bg-card p-6">
                            <Skeleton class="h-6 w-1/2" />
                            <Skeleton class="mt-4 h-2.5 w-full rounded-full" />
                            <Skeleton class="cta-skeleton mt-6 h-12 w-full rounded-xl" />
                        </div>
                        <div class="rounded-2xl border border-border bg-card p-6">
                            <Skeleton class="mb-5 h-6 w-2/3" />
                            <div class="flex flex-col gap-4">
                                <div v-for="n in 3" :key="`rinci-${n}`" class="flex items-start gap-3">
                                    <Skeleton class="size-8 shrink-0 rounded-full" />
                                    <div class="min-w-0 flex-1 space-y-1.5">
                                        <Skeleton class="h-3 w-20" />
                                        <Skeleton class="h-4 w-3/4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section v-else class="relative bg-background pt-20 sm:pt-24 lg:pt-20">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="rounded-[2rem] bg-muted/40 p-1.5 ring-1 ring-border/70 sm:p-2 lg:rounded-[2.25rem]">
                    <article
                        :class="[
                            'overflow-hidden rounded-[calc(2rem-0.375rem)] border border-border/70 bg-card shadow-sm transition-all duration-700 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)] lg:rounded-[calc(2.25rem-0.5rem)]',
                            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                        ]"
                    >
                        <div :class="eventHeroBannerContainerClass('lg:aspect-auto lg:h-full lg:min-h-0')">
                            <img :src="event.banner_url ?? ''" :alt="event.title" class="h-full w-full object-cover" />
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent lg:from-black/35"
                            />
                            <div class="absolute right-4 bottom-4 left-4 flex flex-wrap gap-2 lg:hidden">
                                <span
                                    v-for="cat in toCategoryList(event.category)"
                                    :key="cat"
                                    class="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase shadow-sm"
                                >
                                    {{ categoryLabelMap[cat] ?? cat }}
                                </span>
                            </div>
                        </div>

                        <div class="flex min-w-0 flex-col gap-5 p-5 sm:p-7 lg:justify-between lg:p-9">
                            <div class="min-w-0">
                                <div class="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
                                    <span
                                        v-for="cat in toCategoryList(event.category)"
                                        :key="cat"
                                        class="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase"
                                        :style="{ color: categoryColorMap[cat] ?? 'var(--muted-foreground)' }"
                                    >
                                        {{ categoryLabelMap[cat] ?? cat }}
                                    </span>
                                    <span
                                        :class="[
                                            'rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase',
                                            eventStatusUi(event.registration_status).tone,
                                        ]"
                                    >
                                        {{ eventStatusUi(event.registration_status).label }}
                                    </span>
                                </div>

                                <span
                                    :class="[
                                        'mb-3 inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase lg:hidden',
                                        eventStatusUi(event.registration_status).tone,
                                    ]"
                                >
                                    {{ eventStatusUi(event.registration_status).label }}
                                </span>

                                <h1
                                    class="font-display text-[1.8rem] leading-[1.07] font-bold tracking-tight text-balance break-words text-foreground sm:text-[2.35rem] lg:text-5xl lg:leading-[1.04]"
                                >
                                    {{ event.title }}
                                </h1>
                            </div>

                            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <div
                                    class="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5"
                                >
                                    <div
                                        class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
                                    >
                                        <CalendarDays class="size-4" />
                                    </div>
                                    <div class="min-w-0">
                                        <p
                                            class="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                                        >
                                            Tanggal
                                        </p>
                                        <p class="mt-0.5 text-[0.95rem] leading-snug font-semibold text-foreground">
                                            {{ formatDisplayDate(event.start_date) }}
                                        </p>
                                        <p class="text-[0.8rem] leading-relaxed text-muted-foreground">
                                            {{
                                                toCategoryList(event.session)
                                                    .map((s) => sessionLabelMap[s] ?? s)
                                                    .join(', ')
                                            }}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    class="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3.5"
                                >
                                    <div
                                        class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
                                    >
                                        <MapPin class="size-4" />
                                    </div>
                                    <div class="min-w-0">
                                        <p
                                            class="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                                        >
                                            Lokasi
                                        </p>
                                        <p
                                            class="mt-0.5 text-[0.95rem] leading-snug font-semibold break-words text-foreground"
                                        >
                                            {{ event.location }}
                                        </p>
                                        <p class="text-[0.8rem] leading-relaxed text-muted-foreground">Venue acara</p>
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
                                <div class="mb-2 flex items-end justify-between gap-4">
                                    <div>
                                        <p
                                            class="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                                        >
                                            Kapasitas
                                        </p>
                                        <p class="mt-1 text-sm font-semibold text-foreground">
                                            {{ formatCountNumber(event.registered_count) }} /
                                            {{ formatCountNumber(event.quota) }} terdaftar
                                        </p>
                                    </div>
                                    <span class="font-display text-2xl font-bold text-primary tabular-nums"
                                        >{{ capacityPercent }}%</span
                                    >
                                </div>
                                <div class="h-2.5 w-full overflow-hidden rounded-full bg-background">
                                    <div
                                        class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                        :style="{ width: capacityPercent + '%' }"
                                    />
                                </div>
                            </div>

                            <Link
                                :href="
                                    page.props.auth?.user
                                        ? routes.member.event.show(event.slug)
                                        : routes.auth.registerWithIntended(routes.member.event.show(event.slug))
                                "
                                class="group inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-primary/15 bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/92"
                            >
                                {{ page.props.auth?.user ? 'View Details' : 'Register Now' }}
                                <span class="grid size-7 place-items-center rounded-full bg-white/15">
                                    <ArrowRight class="size-4" />
                                </span>
                            </Link>
                        </div>
                    </article>
                </div>

                <div class="mt-8 grid gap-6 pb-14 sm:gap-8 sm:pb-20 lg:grid-cols-3 lg:gap-10">
                    <div
                        :class="[
                            'order-2 transition-all duration-700 lg:order-1 lg:col-span-2',
                            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                        ]"
                        style="transition-delay: 200ms"
                    >
                        <div class="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-7">
                            <h2
                                class="font-display text-[1.45rem] leading-tight font-bold tracking-tight text-foreground sm:text-3xl"
                            >
                                About this event
                            </h2>
                            <div
                                class="prose prose-sm mt-4 max-w-none text-muted-foreground"
                                v-html="event.description"
                            />
                        </div>

                        <div class="mt-6 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-7">
                            <h3
                                class="mb-4 font-display text-[1.25rem] leading-tight font-bold tracking-tight text-foreground sm:text-2xl"
                            >
                                What you'll get
                            </h3>
                            <div class="grid gap-3 sm:grid-cols-2">
                                <div
                                    v-for="item in highlights"
                                    :key="item"
                                    class="flex items-center gap-3 rounded-2xl border border-border bg-muted/15 p-4 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/30"
                                >
                                    <div class="grid size-7 place-items-center rounded-full bg-success/10">
                                        <Check class="size-3.5 text-success" />
                                    </div>
                                    <span class="text-sm font-medium text-foreground">{{ item }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        :class="[
                            'hidden transition-all duration-700 lg:order-2 lg:block',
                            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                        ]"
                        style="transition-delay: 300ms"
                    >
                        <div class="flex flex-col gap-6 lg:sticky lg:top-28">
                            <div class="app-surface hidden rounded-2xl p-6 lg:block">
                                <h3
                                    class="mb-4 font-display text-[1.2rem] leading-tight font-bold tracking-tight text-foreground"
                                >
                                    Registration
                                </h3>
                                <div class="mb-2 flex items-end justify-between">
                                    <span class="font-display text-2xl font-bold text-primary"
                                        >{{ capacityPercent }}%</span
                                    >
                                    <span class="text-xs text-muted-foreground">
                                        {{ formatCountNumber(event.registered_count) }} /
                                        {{ formatCountNumber(event.quota) }}
                                    </span>
                                </div>
                                <div class="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                        :style="{ width: capacityPercent + '%' }"
                                    />
                                </div>
                                <Link
                                    :href="
                                        page.props.auth?.user
                                            ? routes.member.event.show(event.slug)
                                            : routes.auth.registerWithIntended(routes.member.event.show(event.slug))
                                    "
                                    class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/92"
                                >
                                    {{ page.props.auth?.user ? 'View Details' : 'Register Now' }}
                                    <ArrowRight class="size-4" />
                                </Link>
                            </div>

                            <div class="app-surface rounded-2xl p-6">
                                <h3
                                    class="mb-5 font-display text-[1.2rem] leading-tight font-bold tracking-tight text-foreground"
                                >
                                    Event Details
                                </h3>
                                <div class="flex flex-col gap-4">
                                    <div class="flex items-start gap-3">
                                        <div class="grid size-8 shrink-0 place-items-center rounded-full bg-muted/40">
                                            <CalendarDays class="size-4 text-muted-foreground" />
                                        </div>
                                        <div class="min-w-0">
                                            <p
                                                class="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                                            >
                                                Date & Time
                                            </p>
                                            <p class="text-sm font-semibold text-foreground">
                                                {{ formatDisplayDate(event.start_date) }}
                                            </p>
                                            <p class="text-xs text-muted-foreground">
                                                {{
                                                    toCategoryList(event.session)
                                                        .map((s) => sessionLabelMap[s] ?? s)
                                                        .join(', ')
                                                }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <div class="grid size-8 shrink-0 place-items-center rounded-full bg-muted/40">
                                            <MapPin class="size-4 text-muted-foreground" />
                                        </div>
                                        <div class="min-w-0">
                                            <p
                                                class="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                                            >
                                                Location
                                            </p>
                                            <p class="text-sm font-semibold text-foreground">{{ event.location }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <div class="grid size-8 shrink-0 place-items-center rounded-full bg-muted/40">
                                            <Shield class="size-4 text-muted-foreground" />
                                        </div>
                                        <div class="min-w-0">
                                            <p
                                                class="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                                            >
                                                Category
                                            </p>
                                            <p class="flex flex-wrap gap-1 text-sm font-semibold">
                                                <span
                                                    v-for="(cat, idx) in toCategoryList(event.category)"
                                                    :key="cat"
                                                    :style="{ color: categoryColorMap[cat] ?? 'var(--foreground)' }"
                                                >
                                                    {{ categoryLabelMap[cat] ?? cat
                                                    }}<span v-if="idx < toCategoryList(event.category).length - 1"
                                                        >,</span
                                                    >
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </LandingLayout>
</template>
