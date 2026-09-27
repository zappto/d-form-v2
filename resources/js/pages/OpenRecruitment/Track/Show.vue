<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { Head, Link, router, useForm } from '@inertiajs/vue3';
import { useDraftRestore, type IDraftValuesSnapshot } from '@/hooks/useDraftRestore';
import FormFillLayout from '@/layouts/FormFillLayout.vue';
import OpRecFeedbackForm from '@/components/modules/open-recruitment/OpRecFeedbackForm.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { routes } from '@/lib/routes';
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message';
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    Circle,
    CircleDot,
    LogOut,
    MapPin,
    MessageSquare,
    Pencil,
    QrCode,
    Users,
} from 'lucide-vue-next';

defineOptions({ layout: FormFillLayout });

interface ITimelineItem {
    key: string;
    label: string;
    status: 'completed' | 'current' | 'upcoming';
    note?: string | null;
}

interface INextAction {
    tone: 'info' | 'warning' | 'success' | 'neutral';
    title: string;
    description: string;
    action: string | null;
}

interface ITrackingPayload {
    application: {
        registration_number: string;
        full_name: string;
        nim: string;
        semester: number;
        stage: string;
        stage_label: string;
        result: string;
        result_label: string;
        revision_required: boolean;
        primary_division: string | null;
        secondary_division: string | null;
        submitted_at: string | null;
    };
    period: { name: string | null };
    next_action: INextAction;
    timeline: ITimelineItem[];
    interview: {
        scheduled_at: string;
        location: string;
        room: string;
        status: string;
        status_label: string;
    } | null;
    queue: {
        queue_number: number;
        status: string;
        status_label?: string;
    } | null;
    attendance: {
        checked_in_at: string;
        method: string;
    } | null;
    attendance_qr_base64: string | null;
    final: {
        membership_type: string | null;
        final_division: string | null;
        public_message: string | null;
        result: string;
        result_label: string;
    } | null;
    edit: {
        can_edit: boolean;
        can_request_correction: boolean;
        latest_correction: {
            id: string;
            status: string;
            status_label: string;
            request_message: string;
            review_notes: string | null;
        } | null;
    };
    feedback: {
        can_submit: boolean;
        submitted: boolean;
        submitted_at: string | null;
    };
}

const props = defineProps<{
    tracking: ITrackingPayload | undefined;
    logoutUrl: string;
    editUrl: string;
    correctionUrl: string;
    feedbackStoreUrl: string;
}>();

/** Tanpa GET (props saja): skeleton hanya untuk props awal yang belum ada. */
const correctionModalOpen = ref(false);
const feedbackExpanded = ref(props.tracking?.feedback.can_submit ?? false);
const interviewSectionRef = ref<HTMLElement | null>(null);

const correctionForm = useForm({
    request_message: '',
});

function correctionDraftSnapshot(): string {
    return JSON.stringify({ values: { request_message: correctionForm.request_message } });
}

/** Batas luar snapshot localStorage: verifikasi bentuk `{ values }` sebelum dipakai. */
function isValuesSnapshot(value: unknown): value is IDraftValuesSnapshot {
    if (typeof value !== 'object' || value === null || !('values' in value)) return false;
    const values: unknown = value.values;
    return typeof values === 'object' && values !== null;
}

/** Restorasi toleran: snapshot rusak/parsial diabaikan; hanya pesan teks yang dituang ke form. */
function applyCorrectionDraftValues(draft: IDraftValuesSnapshot): void {
    if (!isValuesSnapshot(draft)) return;
    const message = draft.values.request_message;
    if (typeof message === 'string' && message !== '') {
        correctionForm.request_message = message;
    }
}

const { clear: clearCorrectionDraft } = useDraftRestore({
    snapshot: correctionDraftSnapshot,
    storageKey: 'dform:track-correction',
    restoreIntoForm: applyCorrectionDraftValues,
});

const heroToneClass = computed(() => {
    const tracking = props.tracking;
    if (!tracking) return '';
    const tone = tracking.next_action.tone;
    if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950';
    if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
    if (tone === 'neutral') return 'border-border/70 bg-muted/40';
    return 'border-primary/20 bg-primary/5';
});

const interviewSchedule = computed(() => {
    const scheduledAt = props.tracking?.interview?.scheduled_at;
    if (!scheduledAt) return null;
    return new Date(scheduledAt).toLocaleString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
});

const showInterviewSection = computed(() => {
    const tracking = props.tracking;
    if (!tracking) return false;
    return (
        tracking.interview !== null ||
        tracking.attendance_qr_base64 !== null ||
        tracking.attendance !== null ||
        tracking.queue !== null
    );
});

function timelineIcon(status: ITimelineItem['status']) {
    if (status === 'completed') return CheckCircle2;
    if (status === 'current') return CircleDot;
    return Circle;
}

function scrollToInterview() {
    interviewSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleHeroAction() {
    const tracking = props.tracking;
    if (!tracking) return;
    const action = tracking.next_action.action;
    if (action === 'edit') {
        router.visit(props.editUrl);
        return;
    }
    if (action === 'feedback') {
        feedbackExpanded.value = true;
        nextTick(() => {
            document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' });
        });
        return;
    }
    if (action === 'qr' || action === 'interview' || action === 'queue') {
        scrollToInterview();
    }
}

function logout() {
    router.post(props.logoutUrl);
}

function submitCorrection(): void {
    if (correctionForm.processing) return;
    correctionForm.post(props.correctionUrl, {
        preserveScroll: true,
        onSuccess: () => {
            clearCorrectionDraft();
            // Manual: CorrectionRequestController::store memakai ->with('toast') sesi
            // biasa yang tidak dibaca usePageFlashToast (hanya page.flash.toast).
            showFlashToast({
                type: 'success',
                message: 'Permintaan koreksi berhasil dikirim. Tim akan meninjau segera.',
            });
            correctionModalOpen.value = false;
            correctionForm.reset();
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal mengirim permintaan koreksi' });
        },
    });
}
</script>

<template>
    <Head title="Portal OpRec" />

    <div v-if="!tracking" class="mx-auto max-w-2xl space-y-5 px-2 pb-10" aria-busy="true" aria-label="Memuat portal">
        <!-- Header identitas ringkas -->
        <div class="flex items-start justify-between gap-3 pt-2">
            <div class="min-w-0 flex-1 space-y-2">
                <Skeleton class="h-3 w-24" />
                <Skeleton class="h-6 w-2/3" />
                <div class="mt-1.5 flex flex-wrap items-center gap-2">
                    <Skeleton class="h-3 w-28 font-mono" />
                    <Skeleton class="h-5 w-20 rounded-full" />
                </div>
            </div>
            <Skeleton class="size-9 shrink-0" />
        </div>

        <!-- Langkah selanjutnya -->
        <div class="track-hero-skeleton rounded-2xl border p-5 shadow-sm">
            <Skeleton class="h-3 w-40" />
            <Skeleton class="mt-2 h-6 w-3/4" />
            <Skeleton class="mt-2 h-4 w-full" />
            <Skeleton class="mt-3 h-8 w-32" />
        </div>

        <!-- Hari-H interview -->
        <div class="track-interview-skeleton rounded-2xl border border-border/70">
            <div class="space-y-4 p-4">
                <Skeleton class="h-5 w-40" />
                <Skeleton class="h-4 w-2/3" />
                <Skeleton class="h-4 w-1/2" />
                <Skeleton class="h-9 w-24" />
            </div>
        </div>

        <!-- Alur proses -->
        <div class="rounded-2xl border border-border/70">
            <div class="space-y-2 px-4 pt-4">
                <Skeleton class="h-5 w-28" />
            </div>
            <div class="p-4">
                <ol
                    class="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-border"
                >
                    <li v-for="n in 4" :key="`linimasa-${n}`" class="track-timeline-node relative flex gap-2.5">
                        <Skeleton class="relative z-10 mt-0.5 size-4 shrink-0 rounded-full" />
                        <div class="min-w-0 flex-1 space-y-1.5">
                            <Skeleton class="h-4 w-1/2" />
                            <Skeleton class="h-3 w-3/4" />
                        </div>
                    </li>
                </ol>
            </div>
        </div>

        <!-- Data pendaftaran -->
        <div class="rounded-2xl border border-border/70">
            <div class="space-y-2 px-4 pt-4">
                <Skeleton class="h-5 w-36" />
            </div>
            <div class="space-y-2 p-4">
                <div v-for="n in 5" :key="`data-${n}`" class="flex items-center justify-between gap-4 py-1.5">
                    <Skeleton class="h-3 w-20" />
                    <Skeleton class="h-4 w-32" />
                </div>
            </div>
        </div>

        <!-- Keputusan akhir -->
        <div class="track-final-skeleton rounded-2xl border border-border/70 p-4">
            <Skeleton class="h-5 w-36" />
            <Skeleton class="mt-3 h-6 w-1/2" />
            <Skeleton class="mt-2 h-4 w-2/3" />
            <Skeleton class="mt-1.5 h-4 w-full" />
        </div>

        <!-- Feedback inline -->
        <div class="track-feedback-skeleton rounded-2xl border border-border/70 p-4">
            <Skeleton class="h-5 w-28" />
            <Skeleton class="mt-3 h-4 w-full" />
            <Skeleton class="mt-2 h-9 w-32" />
        </div>

        <p class="text-center text-xs text-muted-foreground">
            <Link :href="routes.recruitment.landing" class="underline-offset-2 hover:underline">
                Info OpenRecruitment
            </Link>
        </p>
    </div>

    <div v-else class="fade-up mx-auto max-w-2xl space-y-5 px-2 pb-10">
        <!-- Header identitas ringkas -->
        <div class="flex items-start justify-between gap-3 pt-2">
            <div class="min-w-0">
                <p class="text-xs font-semibold tracking-wide text-primary uppercase">Portal OpRec</p>
                <h1 class="truncate text-xl font-bold tracking-tight">{{ tracking.application.full_name }}</h1>
                <div class="mt-1.5 flex flex-wrap items-center gap-2">
                    <p class="font-mono text-xs text-muted-foreground">
                        {{ tracking.application.registration_number }}
                    </p>
                    <Badge variant="secondary">{{ tracking.application.stage_label }}</Badge>
                </div>
            </div>
            <Button variant="ghost" size="icon" class="shrink-0" title="Keluar" aria-label="Keluar" @click="logout">
                <LogOut class="size-4" />
            </Button>
        </div>

        <!-- Langkah selanjutnya -->
        <div class="rounded-2xl border p-5 shadow-sm" :class="heroToneClass">
            <p class="text-xs font-medium tracking-wide uppercase opacity-80">Langkah selanjutnya</p>
            <h2 class="mt-1 text-lg leading-snug font-semibold">{{ tracking.next_action.title }}</h2>
            <p class="mt-1.5 text-sm leading-relaxed opacity-90">{{ tracking.next_action.description }}</p>
            <div v-if="tracking.next_action.action" class="mt-3">
                <Button
                    size="sm"
                    :variant="tracking.next_action.tone === 'warning' ? 'default' : 'secondary'"
                    @click="handleHeroAction"
                >
                    {{
                        tracking.next_action.action === 'edit'
                            ? 'Edit pendaftaran'
                            : tracking.next_action.action === 'feedback'
                              ? 'Isi feedback'
                              : tracking.next_action.action === 'qr'
                                ? 'Lihat QR absensi'
                                : 'Lihat detail interview'
                    }}
                    <ArrowRight class="ml-1.5 size-4" />
                </Button>
            </div>
        </div>

        <!-- Aksi cepat -->
        <div v-if="tracking.edit.can_edit || tracking.edit.can_request_correction" class="flex flex-wrap gap-2">
            <Button v-if="tracking.edit.can_edit" as-child size="sm">
                <Link :href="editUrl">
                    <Pencil class="mr-1.5 size-4" />
                    Edit data
                </Link>
            </Button>
            <Button
                v-if="tracking.edit.can_request_correction"
                variant="outline"
                size="sm"
                @click="correctionModalOpen = true"
            >
                Ajukan koreksi
            </Button>
        </div>

        <!-- Koreksi pending -->
        <p
            v-if="tracking.edit.latest_correction?.status === 'pending'"
            class="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground"
        >
            Koreksi: {{ tracking.edit.latest_correction.status_label }} —
            {{ tracking.edit.latest_correction.request_message }}
        </p>

        <!-- Hari-H interview: satu kartu event kohesif -->
        <section v-if="showInterviewSection" ref="interviewSectionRef" id="interview-section" class="scroll-mt-24">
            <Card class="rounded-2xl border-border/70">
                <CardHeader class="pb-3">
                    <CardTitle class="flex items-center gap-2 text-base">
                        <CalendarClock class="size-4 text-primary" />
                        Hari-H interview
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div v-if="tracking.interview" class="space-y-1.5 text-sm">
                        <p v-if="interviewSchedule" class="font-medium">{{ interviewSchedule }}</p>
                        <p class="flex items-start gap-2 text-muted-foreground">
                            <MapPin class="mt-0.5 size-4 shrink-0" />
                            <span>{{ tracking.interview.location }} · Ruang {{ tracking.interview.room }}</span>
                        </p>
                        <p class="text-xs text-muted-foreground">Status: {{ tracking.interview.status_label }}</p>
                    </div>

                    <div v-if="tracking.queue">
                        <Separator v-if="tracking.interview" class="mb-4" />
                        <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users class="size-3.5" />
                            Nomor antrean
                        </p>
                        <p class="mt-0.5 text-3xl font-bold tabular-nums">#{{ tracking.queue.queue_number }}</p>
                        <p class="text-sm text-muted-foreground">
                            {{ tracking.queue.status_label ?? tracking.queue.status }}
                        </p>
                    </div>

                    <div v-if="tracking.attendance_qr_base64 && !tracking.attendance">
                        <Separator v-if="tracking.interview || tracking.queue" class="mb-4" />
                        <div class="space-y-2 text-center">
                            <p class="flex items-center justify-center gap-1.5 text-xs font-medium">
                                <QrCode class="size-3.5" />
                                QR absensi
                            </p>
                            <img
                                :src="`data:image/png;base64,${tracking.attendance_qr_base64}`"
                                alt="QR code absensi"
                                class="mx-auto size-48 rounded-xl border bg-white p-2"
                            />
                            <p class="text-xs leading-relaxed text-muted-foreground">
                                Tunjukkan ke panitia — tidak perlu check-in sendiri.
                            </p>
                        </div>
                    </div>

                    <p v-if="tracking.attendance" class="text-xs text-muted-foreground">
                        Check-in:
                        {{
                            tracking.attendance.checked_in_at
                                ? new Date(tracking.attendance.checked_in_at).toLocaleString('id-ID')
                                : '—'
                        }}
                    </p>
                </CardContent>
            </Card>
        </section>

        <!-- Alur proses: selalu terlihat -->
        <Card class="rounded-2xl border-border/70">
            <CardHeader class="pb-2">
                <CardTitle class="text-base">Alur proses</CardTitle>
            </CardHeader>
            <CardContent>
                <ol
                    class="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-border"
                >
                    <li v-for="item in tracking.timeline" :key="item.key" class="relative flex gap-2.5">
                        <component
                            :is="timelineIcon(item.status)"
                            class="relative z-10 mt-0.5 size-4 shrink-0 bg-card"
                            :class="{
                                'text-primary': item.status === 'current',
                                'text-emerald-600': item.status === 'completed',
                                'text-muted-foreground/40': item.status === 'upcoming',
                            }"
                        />
                        <div class="min-w-0">
                            <p
                                class="text-sm font-medium"
                                :class="item.status === 'upcoming' ? 'text-muted-foreground' : ''"
                            >
                                {{ item.label }}
                            </p>
                            <p v-if="item.note" class="mt-0.5 text-xs text-amber-700">{{ item.note }}</p>
                        </div>
                    </li>
                </ol>
            </CardContent>
        </Card>

        <!-- Data pendaftaran -->
        <Card class="rounded-2xl border-border/70">
            <CardHeader class="pb-2">
                <CardTitle class="text-base">Data pendaftaran</CardTitle>
            </CardHeader>
            <CardContent>
                <dl class="divide-y divide-border/60 text-sm">
                    <div class="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                        <dt class="shrink-0 text-muted-foreground">Tahap</dt>
                        <dd class="text-right font-medium">{{ tracking.application.stage_label }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                        <dt class="shrink-0 text-muted-foreground">Hasil</dt>
                        <dd class="text-right font-medium">{{ tracking.application.result_label }}</dd>
                    </div>
                    <div
                        v-if="tracking.period.name"
                        class="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                    >
                        <dt class="shrink-0 text-muted-foreground">Periode</dt>
                        <dd class="text-right font-medium">{{ tracking.period.name }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                        <dt class="shrink-0 text-muted-foreground">Divisi</dt>
                        <dd class="text-right font-medium">
                            {{ tracking.application.primary_division ?? '—' }}
                            <span
                                v-if="tracking.application.secondary_division"
                                class="font-normal text-muted-foreground"
                            >
                                · cadangan {{ tracking.application.secondary_division }}
                            </span>
                        </dd>
                    </div>
                    <div class="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                        <dt class="shrink-0 text-muted-foreground">NIM</dt>
                        <dd class="text-right font-medium">{{ tracking.application.nim }}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>

        <!-- Keputusan akhir -->
        <Card v-if="tracking.final" class="rounded-2xl border-border/70">
            <CardHeader class="pb-2">
                <CardTitle class="text-base">Keputusan akhir</CardTitle>
            </CardHeader>
            <CardContent class="space-y-1.5 text-sm">
                <p class="text-lg font-semibold">{{ tracking.final.result_label }}</p>
                <p v-if="tracking.final.membership_type">Keanggotaan: {{ tracking.final.membership_type }}</p>
                <p v-if="tracking.final.final_division">Divisi: {{ tracking.final.final_division }}</p>
                <p v-if="tracking.final.public_message" class="pt-1 text-muted-foreground">
                    {{ tracking.final.public_message }}
                </p>
            </CardContent>
        </Card>

        <!-- Feedback inline -->
        <Card
            v-if="tracking.feedback.can_submit || tracking.feedback.submitted"
            id="feedback-section"
            class="scroll-mt-24 rounded-2xl border-border/70"
        >
            <CardHeader
                class="cursor-pointer pb-2"
                @click="tracking.feedback.can_submit && (feedbackExpanded = !feedbackExpanded)"
            >
                <CardTitle class="flex items-center justify-between text-base">
                    <span class="flex items-center gap-2">
                        <MessageSquare class="size-4" />
                        Feedback
                    </span>
                    <ChevronDown
                        v-if="tracking.feedback.can_submit"
                        class="size-4 transition-transform"
                        :class="feedbackExpanded ? 'rotate-180' : ''"
                    />
                </CardTitle>
            </CardHeader>
            <CardContent v-if="tracking.feedback.submitted" class="text-sm text-muted-foreground">
                Terima kasih! Feedback diterima
                {{
                    tracking.feedback.submitted_at
                        ? new Date(tracking.feedback.submitted_at).toLocaleDateString('id-ID')
                        : ''
                }}.
            </CardContent>
            <CardContent v-else-if="feedbackExpanded">
                <OpRecFeedbackForm :store-url="feedbackStoreUrl" compact />
            </CardContent>
        </Card>

        <p class="text-center text-xs text-muted-foreground">
            <Link :href="routes.recruitment.landing" class="underline-offset-2 hover:underline">
                Info OpenRecruitment
            </Link>
        </p>
    </div>

    <Dialog v-model:open="correctionModalOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Permintaan koreksi</DialogTitle>
                <DialogDescription>Jelaskan data yang perlu diperbaiki.</DialogDescription>
            </DialogHeader>
            <form class="space-y-4" @submit.prevent="submitCorrection">
                <div class="space-y-2">
                    <Label for="request_message">Pesan</Label>
                    <Textarea
                        id="request_message"
                        v-model="correctionForm.request_message"
                        rows="4"
                        required
                        minlength="10"
                        placeholder="Contoh: NIM saya salah ketik..."
                    />
                    <p v-if="correctionForm.errors.request_message" class="text-xs text-destructive">
                        {{ correctionForm.errors.request_message }}
                    </p>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" @click="correctionModalOpen = false">Batal</Button>
                    <Button type="submit" :disabled="correctionForm.processing" :aria-busy="correctionForm.processing">
                        <CometSpinner v-if="correctionForm.processing" :size="16" />
                        {{ correctionForm.processing ? 'Mengirim...' : 'Kirim' }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>
