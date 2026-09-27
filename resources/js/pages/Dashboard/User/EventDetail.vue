<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    MapPin,
    CalendarDays,
    Clock,
    DollarSign,
    Users,
    Send,
    Mail,
    MailOpen,
    FileText,
    ChevronRight,
    Lock,
} from 'lucide-vue-next';
import { Skeleton } from '@/components/ui/skeleton';
import { statusColorMap, categoryLabelMap, categoryColorMap, sessionLabelMap } from '@/lib/dummyData';
import { CATEGORY_COLOR_FALLBACK } from '@/lib/categoryColor';
import { formatDisplayDate, formatDisplayDateTime, formatRupiahPrice } from '@/lib/format';
import { toCategoryList } from '@/lib/eventCategories';
import EventBannerImage from '@/components/modules/dashboard/EventBannerImage.vue';
import TiptapRichHtml from '@/components/modules/dashboard/events/TiptapRichHtml.vue';
import { routes } from '@/lib/routes';
import { EVENT_HERO_BANNER_ASPECT } from '@/lib/eventBannerAspect';
import { eventStatusUi } from '@/lib/eventShowUi';
import type { TFormAccessStatus } from '@/types/form';

defineOptions({ layout: DashboardLayout });

type TParticipantFormRow = {
    id: string;
    title: string;
    description: string | null;
    fill_url: string;
    access_status: TFormAccessStatus;
    access_message: string;
    can_start: boolean;
    requires_form_title: string | null;
};

const props = defineProps<{
    event: IEvent | undefined;
    isRegistered: boolean;
    /** Undangan tim/bundle: belum accept/reject — bukan peserta resmi sampai dikonfirmasi */
    pendingTeamInvitationUrl?: string | null;
    registrationStatus: 'pending' | 'accepted' | 'rejected' | null;
    qr_base64: string | null;
    registration_code: string | null;
    participantForms?: TParticipantFormRow[];
}>();

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const eventReady = computed<boolean>(() => props.event !== undefined);

/** Fallback agar komputasi tak membaca props yang belum ada (tak pernah tampil). */
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
const isRegistered = computed(() => props.isRegistered);
const registrationStatus = computed(() => props.registrationStatus);
const participantForms = computed(() => props.participantForms ?? []);

const myRegistrationLabel: Record<NonNullable<typeof props.registrationStatus>, string> = {
    pending: 'Menunggu kajian',
    accepted: 'Diterima',
    rejected: 'Tidak diterima',
};

function participantStatusLabel(s: TFormAccessStatus): string {
    if (s === 'allowed') return 'Tersedia';
    if (s === 'already_submitted') return 'Sudah diisi';
    if (s === 'prerequisite_not_met') return 'Menunggu syarat';
    if (s === 'form_closed') return 'Ditutup';
    return 'Tidak tersedia';
}

const metaBlocks = computed(() => [
    {
        title: 'Jadwal',
        value: `${formatDisplayDate(event.value.start_date)} — ${formatDisplayDate(event.value.end_date)}`,
        icon: CalendarDays,
    },
    { title: 'Lokasi', value: event.value.location || '—', icon: MapPin },
    {
        title: 'Sesi',
        value:
            toCategoryList(event.value.session)
                .map((s) => sessionLabelMap[s] ?? s)
                .join(', ') || '—',
        icon: Clock,
    },
    {
        title: 'Biaya',
        value: event.value.price > 0 ? `Rp ${formatRupiahPrice(Number(event.value.price))}` : 'Gratis',
        icon: DollarSign,
    },
]);

const quotaPercent = computed(() => {
    if (!event.value.quota || event.value.quota <= 0) return 0;
    return Math.min(100, Math.round((event.value.registered_count / event.value.quota) * 100));
});
</script>

<template>
    <Head :title="eventReady ? event.title : 'Detail acara'" />
    <div
        v-if="!eventReady"
        class="mx-auto flex w-full flex-col gap-6 pb-6 sm:gap-8"
        aria-busy="true"
        aria-label="Memuat detail acara"
    >
        <section
            class="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]"
        >
            <div class="flex flex-col lg:grid lg:min-h-[min(26rem,70vh)] lg:grid-cols-2 lg:items-stretch">
                <div
                    class="order-2 flex flex-col justify-center gap-5 border-t border-border/60 bg-gradient-to-b from-card via-card to-muted/25 px-5 py-7 sm:gap-6 sm:px-8 sm:py-9 lg:order-none lg:border-t-0 lg:border-r lg:px-10 xl:px-12"
                >
                    <div class="flex flex-wrap items-center gap-2">
                        <Skeleton class="h-5 w-20 rounded-full" />
                        <Skeleton class="h-5 w-24 rounded-full" />
                    </div>
                    <div class="max-w-xl space-y-4">
                        <Skeleton class="h-8 w-3/4" />
                        <div class="flex flex-col gap-3">
                            <Skeleton class="h-4 w-2/3" />
                            <Skeleton class="h-4 w-1/2" />
                        </div>
                    </div>
                </div>

                <div class="relative order-1 w-full lg:order-none lg:min-h-full lg:min-w-0">
                    <Skeleton
                        class="hero-skeleton aspect-[16/9] h-full w-full rounded-none lg:aspect-auto lg:min-h-[min(26rem,70vh)]"
                    />
                </div>
            </div>
        </section>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="n in 4"
                :key="`meta-${n}`"
                class="group flex min-w-0 gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/10 p-4 shadow-sm"
            >
                <Skeleton class="size-10 shrink-0 rounded-full sm:size-11" />
                <div class="min-w-0 flex-1 space-y-1.5">
                    <Skeleton class="h-2.5 w-16" />
                    <Skeleton class="h-4 w-full" />
                </div>
            </div>
        </div>

        <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
            <div class="flex min-w-0 flex-col gap-8">
                <div class="rounded-2xl border border-border/70 shadow-sm ring-1 ring-black/[0.03]">
                    <div class="border-b border-border/50 bg-muted/10 px-5 py-4 sm:px-6">
                        <Skeleton class="h-5 w-36" />
                    </div>
                    <div class="space-y-2 px-5 py-6 sm:px-6 sm:py-8">
                        <Skeleton class="h-4 w-full" />
                        <Skeleton class="h-4 w-full" />
                        <Skeleton class="h-4 w-2/3" />
                    </div>
                </div>

                <div class="rounded-2xl border border-border/70 shadow-sm ring-1 ring-black/[0.03]">
                    <div class="border-b border-border/50 bg-muted/10 px-5 py-4 sm:px-6">
                        <Skeleton class="h-5 w-44" />
                    </div>
                    <div class="space-y-3 px-5 py-5 sm:px-6">
                        <div
                            v-for="n in 3"
                            :key="`form-${n}`"
                            class="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div class="flex min-w-0 gap-3">
                                <Skeleton class="size-10 shrink-0 rounded-full" />
                                <div class="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton class="h-4 w-40" />
                                    <Skeleton class="h-3 w-24 rounded-full" />
                                </div>
                            </div>
                            <Skeleton class="h-9 w-full sm:w-28" />
                        </div>
                    </div>
                </div>
            </div>

            <aside class="flex min-w-0 flex-col gap-4 xl:sticky xl:top-24">
                <div
                    class="rounded-2xl border-border/70 bg-gradient-to-b from-card via-card to-primary/[0.03] shadow-md ring-1 ring-primary/10"
                >
                    <div class="space-y-1 px-5 pt-5">
                        <Skeleton class="h-4 w-28" />
                        <Skeleton class="h-3 w-40" />
                    </div>
                    <div class="space-y-5 px-5 py-5">
                        <div class="space-y-2">
                            <Skeleton class="h-4 w-2/3" />
                            <Skeleton class="h-2.5 w-full rounded-full" />
                        </div>
                        <div class="rounded-xl border border-border/60 bg-muted/15 px-3 py-3">
                            <Skeleton class="h-3 w-1/2" />
                            <Skeleton class="mt-2 h-3 w-3/4" />
                        </div>
                        <Skeleton class="h-11 w-full" />
                        <div class="flex flex-col items-center gap-3 rounded-xl border border-border/60 p-4">
                            <Skeleton class="h-2.5 w-24" />
                            <Skeleton class="size-40 rounded-xl" />
                            <Skeleton class="h-6 w-32 font-mono" />
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </div>
    <div v-else class="fade-up mx-auto flex w-full flex-col gap-6 pb-6 sm:gap-8">
        <section
            class="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]"
        >
            <div class="flex flex-col lg:grid lg:min-h-[min(26rem,70vh)] lg:grid-cols-2 lg:items-stretch">
                <!-- Kolom konten: permukaan solid, hierarki jelas -->
                <div
                    class="order-2 flex flex-col justify-center gap-5 border-t border-border/60 bg-gradient-to-b from-card via-card to-muted/25 px-5 py-7 sm:gap-6 sm:px-8 sm:py-9 lg:order-none lg:border-t-0 lg:border-r lg:px-10 xl:px-12"
                >
                    <div class="flex flex-wrap items-center gap-2">
                        <Badge
                            v-for="cat in toCategoryList(event.category)"
                            :key="cat"
                            class="border-0 text-[10px] font-semibold text-white shadow-sm"
                            :style="{ backgroundColor: categoryColorMap[cat] ?? CATEGORY_COLOR_FALLBACK }"
                        >
                            {{ categoryLabelMap[cat] ?? cat }}
                        </Badge>
                        <Badge
                            v-if="pendingTeamInvitationUrl"
                            variant="secondary"
                            class="border border-amber-500/50 bg-amber-500/20 text-[10px] font-semibold text-amber-950"
                        >
                            Diundang · menunggu Anda
                        </Badge>
                        <Badge variant="secondary" class="text-[10px] font-semibold capitalize">
                            {{ eventStatusUi(event.registration_status).label }}
                        </Badge>
                    </div>
                    <div class="max-w-xl space-y-4">
                        <h1
                            class="font-display text-[1.625rem] leading-[1.2] font-bold tracking-[-0.02em] break-words text-foreground sm:text-3xl lg:text-[2rem] xl:text-[2.25rem]"
                        >
                            {{ event.title }}
                        </h1>
                        <div class="flex flex-col gap-3 text-sm leading-snug sm:text-[15px]">
                            <span class="inline-flex items-center gap-2.5 text-muted-foreground [&>svg]:shrink-0">
                                <CalendarDays class="size-[1.125rem] text-primary opacity-90" aria-hidden="true" />
                                {{ metaBlocks[0].value }}
                            </span>
                            <span class="inline-flex items-start gap-2.5 text-muted-foreground [&>svg]:shrink-0">
                                <MapPin class="mt-0.5 size-[1.125rem] text-primary opacity-90" aria-hidden="true" />
                                <span class="break-words">{{ metaBlocks[1].value }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Kolom gambar: hanya visual, tanpa gradien/teks di atasnya -->
                <div
                    :class="[
                        EVENT_HERO_BANNER_ASPECT,
                        'relative order-1 w-full lg:order-none lg:aspect-auto lg:min-h-full lg:min-w-0',
                    ]"
                >
                    <EventBannerImage :src="event.banner_url" :alt="event.title" />
                </div>
            </div>
        </section>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="m in metaBlocks"
                :key="m.title"
                class="group flex min-w-0 gap-3 rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/10 p-4 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md"
            >
                <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15 sm:size-11"
                >
                    <component :is="m.icon" class="size-5" stroke-width="2" />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        {{ m.title }}
                    </p>
                    <p class="mt-1 text-sm leading-snug font-semibold break-words text-foreground">{{ m.value }}</p>
                </div>
            </div>
        </div>

        <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
            <div class="flex min-w-0 flex-col gap-8">
                <!-- Deskripsi -->
                <Card class="rounded-2xl border-border/70 shadow-sm ring-1 ring-black/[0.03]">
                    <CardHeader class="border-b border-border/50 bg-muted/10 px-5 py-4 sm:px-6">
                        <CardTitle class="font-display text-base font-bold tracking-tight sm:text-lg"
                            >Tentang acara</CardTitle
                        >
                    </CardHeader>
                    <CardContent class="px-5 py-6 sm:px-6 sm:py-8">
                        <TiptapRichHtml :html="event.description" />
                    </CardContent>
                </Card>

                <Card
                    v-if="isRegistered && participantForms.length > 0"
                    class="rounded-2xl border-border/70 shadow-sm ring-1 ring-black/[0.03]"
                >
                    <CardHeader class="border-b border-border/50 bg-muted/10 px-5 py-4 sm:px-6">
                        <CardTitle class="font-display text-base font-bold tracking-tight sm:text-lg"
                            >Form lainnya</CardTitle
                        >
                        <p class="text-xs leading-relaxed text-muted-foreground">
                            Feedback atau survei tambahan untuk peserta terdaftar.
                        </p>
                    </CardHeader>
                    <CardContent class="space-y-3 px-5 py-5 sm:px-6">
                        <div
                            v-for="form in participantForms"
                            :key="form.id"
                            class="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div class="flex min-w-0 gap-3">
                                <div
                                    class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                                >
                                    <FileText class="size-4.5" aria-hidden="true" />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm leading-snug font-semibold text-foreground">{{ form.title }}</p>
                                    <p
                                        v-if="form.description"
                                        class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                                    >
                                        {{ form.description }}
                                    </p>
                                    <div class="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" class="text-[10px] font-semibold">
                                            {{ participantStatusLabel(form.access_status) }}
                                        </Badge>
                                        <span
                                            v-if="
                                                form.requires_form_title &&
                                                form.access_status === 'prerequisite_not_met'
                                            "
                                            class="text-[10px] text-muted-foreground"
                                        >
                                            Perlu diterima di: {{ form.requires_form_title }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex w-full shrink-0 sm:w-auto">
                                <Button v-if="form.can_start" as-child class="w-full sm:w-auto">
                                    <Link :href="form.fill_url" :prefetch="false" class="justify-center">
                                        Isi form
                                        <ChevronRight class="ml-1 size-4" />
                                    </Link>
                                </Button>
                                <Button v-else variant="outline" disabled class="w-full sm:w-auto">
                                    <Lock class="mr-1.5 size-3.5" aria-hidden="true" />
                                    {{ participantStatusLabel(form.access_status) }}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Sidebar pendaftaran -->
            <aside class="flex min-w-0 flex-col gap-4 xl:sticky xl:top-24">
                <Card
                    class="rounded-2xl border-border/70 bg-gradient-to-b from-card via-card to-primary/[0.03] shadow-md ring-1 ring-primary/10"
                >
                    <CardHeader class="space-y-1 pb-2">
                        <CardTitle class="font-display text-sm font-bold sm:text-base">Pendaftaran</CardTitle>
                        <p class="text-xs text-muted-foreground">Kuota & jadwal buka tutup</p>
                    </CardHeader>
                    <CardContent class="space-y-5 pt-0">
                        <div>
                            <div class="mb-2 flex items-center justify-between text-sm">
                                <span class="flex items-center gap-1.5 text-muted-foreground">
                                    <Users class="size-4 shrink-0" aria-hidden="true" />
                                    Terisi
                                </span>
                                <span class="font-semibold text-foreground tabular-nums">
                                    {{ event.registered_count }}/{{ event.quota }}
                                    <span class="ml-1 text-xs font-normal text-muted-foreground"
                                        >({{ quotaPercent }}%)</span
                                    >
                                </span>
                            </div>
                            <Progress
                                :model-value="event.registered_count"
                                :max="Math.max(event.quota, 1)"
                                class="h-2.5 rounded-full"
                            />
                        </div>
                        <div class="space-y-2 rounded-xl border border-border/60 bg-muted/15 px-3 py-3 text-xs">
                            <p class="flex justify-between gap-2">
                                <span class="text-muted-foreground">Buka</span>
                                <span class="text-right font-medium text-foreground">{{
                                    formatDisplayDateTime(event.registration_start)
                                }}</span>
                            </p>
                            <p class="flex justify-between gap-2">
                                <span class="text-muted-foreground">Tutup</span>
                                <span class="text-right font-medium text-foreground">{{
                                    formatDisplayDateTime(event.registration_end)
                                }}</span>
                            </p>
                        </div>

                        <div v-if="pendingTeamInvitationUrl" class="flex flex-col gap-3">
                            <p class="text-xs leading-relaxed text-muted-foreground">
                                Anda diundang sebagai anggota tim atau paket pendaftaran. Belum tercatat sebagai peserta
                                hingga Anda menyetujui undangan di tautan berikut.
                            </p>
                            <Button class="h-11 w-full text-[15px] font-semibold shadow-sm" as-child>
                                <Link :href="pendingTeamInvitationUrl">
                                    <MailOpen class="mr-2 size-4" aria-hidden="true" />
                                    Lihat undangan
                                </Link>
                            </Button>
                        </div>
                        <div v-else-if="!isRegistered && event.registration_status === 'open'">
                            <Button class="h-11 w-full text-[15px] font-semibold shadow-sm" as-child>
                                <Link :href="routes.member.event.register(event.slug)">
                                    <Send class="mr-2 size-4" aria-hidden="true" />
                                    Daftar untuk acara ini
                                </Link>
                            </Button>
                        </div>
                        <div
                            v-else-if="!isRegistered"
                            class="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs leading-relaxed text-muted-foreground"
                        >
                            Pendaftaran belum dibuka atau sudah berakhir.
                        </div>
                        <div v-else class="flex flex-col gap-4">
                            <Button class="w-full" variant="secondary" as-child>
                                <Link :href="routes.member.event.registration(event.slug)">Detail pendaftaran</Link>
                            </Button>
                            <div class="rounded-xl border border-success/25 bg-success/5 p-4 text-center shadow-sm">
                                <p class="text-sm font-bold text-success">Anda terdaftar</p>
                                <Badge
                                    variant="secondary"
                                    class="mt-2 text-[10px] capitalize"
                                    :style="{
                                        color:
                                            registrationStatus != null ? statusColorMap[registrationStatus] : undefined,
                                    }"
                                >
                                    {{
                                        registrationStatus != null
                                            ? myRegistrationLabel[registrationStatus]
                                            : 'Terdaftar'
                                    }}
                                </Badge>
                            </div>

                            <div
                                v-if="registrationStatus === 'accepted'"
                                class="grid gap-3 rounded-xl border border-border bg-muted/15 p-4 2xl:grid-cols-2 2xl:items-start"
                            >
                                <div class="min-w-0 space-y-2">
                                    <p
                                        class="flex items-center gap-2 text-[10px] font-black tracking-wider text-muted-foreground uppercase"
                                    >
                                        <Mail class="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                                        Check-in
                                    </p>
                                    <ul
                                        class="list-inside list-disc space-y-1 text-[11px] leading-relaxed font-medium text-muted-foreground"
                                    >
                                        <li>QR dan kode manual juga tampil di halaman ini.</li>
                                        <li>Email penerimaan berisi gambar QR yang sama.</li>
                                        <li>Simpan kode manual jika pemindaian gagal.</li>
                                    </ul>
                                </div>
                                <div class="min-w-0 space-y-2">
                                    <p class="text-[10px] font-black tracking-wider text-muted-foreground uppercase">
                                        Di lokasi
                                    </p>
                                    <p class="text-[11px] leading-relaxed font-medium text-foreground/85">
                                        Tunjukkan QR di pintu masuk. Panitia dapat memasukkan kode manual.
                                    </p>
                                </div>
                            </div>

                            <div
                                v-else-if="registrationStatus === 'rejected'"
                                class="rounded-xl border border-border bg-muted/15 p-4"
                            >
                                <p class="text-[11px] leading-relaxed font-medium text-muted-foreground">
                                    Keputusan sudah dikirim lewat email. Periksa spam atau hubungi panitia.
                                </p>
                            </div>

                            <div
                                v-if="registrationStatus === 'accepted' && props.qr_base64"
                                class="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4 shadow-sm"
                            >
                                <p class="text-[10px] font-bold tracking-wider text-success uppercase">QR check-in</p>
                                <img
                                    :src="`data:image/png;base64,${props.qr_base64}`"
                                    alt="Kode QR kehadiran"
                                    width="240"
                                    height="240"
                                    class="h-auto w-full max-w-[240px] rounded-xl border border-border bg-white p-2 shadow-md"
                                />
                                <div v-if="props.registration_code" class="w-full space-y-1 text-center">
                                    <p class="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        Kode manual
                                    </p>
                                    <p class="font-mono text-lg font-bold tracking-[0.12em] text-foreground">
                                        {{ props.registration_code }}
                                    </p>
                                </div>
                                <p class="max-w-[260px] text-center text-[10px] leading-snug text-muted-foreground">
                                    Sama dengan di email penerimaan. Beri kode manual jika scan gagal.
                                </p>
                            </div>
                            <div
                                v-else-if="registrationStatus === 'accepted'"
                                class="rounded-xl border border-dashed border-border bg-muted/15 p-4 text-center text-[11px] text-muted-foreground"
                            >
                                QR tidak dimuat. Buka
                                <Link
                                    :href="routes.member.event.registration(event.slug)"
                                    class="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    detail pendaftaran
                                </Link>
                                atau gunakan email penerimaan.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </aside>
        </div>
    </div>
</template>
