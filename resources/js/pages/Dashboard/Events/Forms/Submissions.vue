<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import KpiCard from '@/components/modules/dashboard/KpiCard.vue';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import {
    FileText,
    Inbox,
    LayoutGrid,
    List,
    Clock,
    Eye,
    Users,
    CalendarClock,
    Download,
    CheckCircle2,
    XCircle,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

defineOptions({ layout: DashboardFocusLayout });

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface SubmissionPaginator {
    data: IFormSubmission[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: PaginationLink[];
}

const props = defineProps<{
    event: { id: string; title: string };
    form: { id: string; title: string };
    fields: IFormField[];
    submissions: SubmissionPaginator;
}>();

const viewType = ref<'table' | 'form'>('table');
const selectedSubmission = ref<IFormSubmission | null>(null);
const isDetailOpen = ref(false);

const fieldLabelMap = computed(() => {
    const map: Record<string, string> = {};
    props.fields.forEach((field) => {
        map[field.name] = field.label;
    });
    return map;
});

const answerKeys = computed(() => {
    // Prefer keys from fields first to maintain order
    const keysFromFields = props.fields.map((f) => f.name);

    // Add other keys present in submissions that are not listed in fields (fallback)
    const keysInSubmissions = new Set<string>();
    for (const submission of props.submissions.data) {
        Object.keys(submission.answers).forEach((key) => keysInSubmissions.add(key));
    }

    const allKeys = [...new Set([...keysFromFields, ...keysInSubmissions])];
    return allKeys.slice(0, 4); // Show fewer columns in table for better readability
});

const allAnswerKeys = computed(() => {
    const keysFromFields = props.fields.map((f) => f.name);
    const keysInSubmissions = new Set<string>();
    for (const submission of props.submissions.data) {
        Object.keys(submission.answers).forEach((key) => keysInSubmissions.add(key));
    }
    return [...new Set([...keysFromFields, ...keysInSubmissions])];
});

const latestSubmissionDate = computed(() => {
    if (props.submissions.data.length === 0) return '-';
    const dates = props.submissions.data.map((s) => new Date(s.submitted_at).getTime());
    return formatDate(new Date(Math.max(...dates)).toISOString());
});

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function humanizeKey(value: string): string {
    return fieldLabelMap.value[value] || value.replace(/^field_/, '').replace(/_/g, ' ');
}

function answerPreview(value: unknown): string {
    if (Array.isArray(value)) return value.map(String).join(', ');
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return 'Empty';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return 'Structured answer';
}

function fileUrl(value: unknown): string | null {
    return typeof value === 'string' && value.includes('/') ? `/storage/${value}` : null;
}

function paginationLabel(value: string): string {
    return value.replace('&laquo;', 'Previous').replace('&raquo;', 'Next');
}

function openDetail(submission: IFormSubmission) {
    selectedSubmission.value = submission;
    isDetailOpen.value = true;
}

/** Approve / reject submission — backend API not implemented yet (no column or routes). */
function submissionReviewStub(action: 'accept' | 'reject', submission: IFormSubmission) {
    const title = action === 'accept' ? 'Terima pendaftar' : 'Tolak pendaftar';
    toast.info(title, {
        description: `Aksi untuk “${submission.user?.name ?? submission.user?.email ?? submission.id}” belum tersedia. Model form_answers belum memiliki status review. Lihat docs/milestone-m1-m4-remaining.md.`,
        duration: 8000,
    });
}
</script>

<template>
    <Head :title="`${form.title} Submissions`" />

    <div class="app-page">
        <div class="flex flex-col gap-8">
            <PageHeader
                :title="form.title"
                :subtitle="`Collected responses for ${event.title}`"
                :back-href="`/dashboard/events/${event.id}/forms/${form.id}`"
            >
                <template #actions>
                    <div class="flex items-center gap-2.5">
                        <Tabs v-model="viewType" class="w-auto">
                            <TabsList>
                                <TabsTrigger value="table">
                                    <List class="mr-1.5 size-3.5" />
                                    Table
                                </TabsTrigger>
                                <TabsTrigger value="form">
                                    <LayoutGrid class="mr-1.5 size-3.5" />
                                    Cards
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button variant="outline" size="sm">
                            <Download class="mr-1.5 size-4" />
                            Export
                        </Button>
                    </div>
                </template>
            </PageHeader>

            <div v-if="submissions.total > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard label="Total Submissions" :value="submissions.total" :icon="Users" color="primary" />
                <KpiCard label="Latest Response" :value="latestSubmissionDate" :icon="CalendarClock" color="warning" />
            </div>

            <div
                v-if="submissions.data.length === 0"
                class="app-surface-soft flex flex-col items-center justify-center py-24 text-center"
            >
                <div class="grid size-16 place-items-center rounded-2xl border border-border bg-card shadow-xs">
                    <Inbox class="size-7 text-muted-foreground" />
                </div>
                <h3 class="font-display mt-6 text-xl font-bold tracking-[-0.02em] text-foreground">No responses yet</h3>
                <p class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    When people submit this form, you'll see their detailed answers here in real-time.
                </p>
            </div>

            <template v-else>
                <div v-if="viewType === 'table'" class="app-surface overflow-hidden p-0">
                    <div class="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow class="hover:bg-transparent">
                                    <TableHead
                                        class="sticky left-0 z-20 h-12 bg-muted/40 px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                                    >
                                        Member
                                    </TableHead>
                                    <TableHead
                                        v-for="key in answerKeys"
                                        :key="key"
                                        class="h-12 min-w-[180px] bg-muted/30 px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                                    >
                                        {{ humanizeKey(key) }}
                                    </TableHead>
                                    <TableHead class="h-12 bg-muted/30 px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Submitted
                                    </TableHead>
                                    <TableHead class="h-12 bg-muted/30 px-6 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow
                                    v-for="(submission, idx) in submissions.data"
                                    :key="submission.id"
                                    class="animate-app-fade-in border-b border-border/60 transition-colors hover:bg-muted/30"
                                    :style="{ animationDelay: `${idx * 50}ms` }"
                                >
                                    <TableCell class="sticky left-0 z-10 border-r border-border/60 bg-card px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <Avatar class="size-9 rounded-lg border border-border">
                                                <AvatarImage :src="''" :alt="submission.user?.name ?? 'U'" />
                                                <AvatarFallback class="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                                                    {{ getInitials(submission.user?.name ?? 'An') }}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div class="min-w-0">
                                                <p class="truncate text-sm font-semibold tracking-[-0.005em] text-foreground">
                                                    {{ submission.user?.name ?? 'Anonymous' }}
                                                </p>
                                                <p class="truncate text-[10px] text-muted-foreground">
                                                    {{ submission.user?.email ?? '-' }}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        v-for="key in answerKeys"
                                        :key="key"
                                        class="max-w-[240px] px-6 py-4 text-xs leading-relaxed"
                                    >
                                        <div v-if="fileUrl(submission.answers[key])" class="flex items-center gap-1.5 text-primary">
                                            <FileText class="size-3.5" />
                                            <span class="font-medium underline underline-offset-4">Attachment</span>
                                        </div>
                                        <span v-else class="line-clamp-2 text-foreground/85">
                                            {{ answerPreview(submission.answers[key]) }}
                                        </span>
                                    </TableCell>
                                    <TableCell class="whitespace-nowrap px-6 py-4 text-[11px] text-muted-foreground">
                                        {{ formatDate(submission.submitted_at) }}
                                    </TableCell>
                                    <TableCell class="px-6 py-4 text-center">
                                        <div class="flex items-center justify-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                title="Accept (UI only)"
                                                class="text-success hover:bg-success/10 hover:text-success"
                                                @click="submissionReviewStub('accept', submission)"
                                            >
                                                <CheckCircle2 class="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                title="Reject (UI only)"
                                                class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                @click="submissionReviewStub('reject', submission)"
                                            >
                                                <XCircle class="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                class="hover:bg-primary/10 hover:text-primary"
                                                @click="openDetail(submission)"
                                            >
                                                <Eye class="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="(submission, idx) in submissions.data"
                        :key="submission.id"
                        class="app-surface animate-app-fade-in flex flex-col p-6"
                        :style="{ animationDelay: `${idx * 100}ms` }"
                    >
                        <div class="flex items-center gap-3 border-b border-border pb-5">
                            <Avatar class="size-11 rounded-xl border border-border">
                                <AvatarFallback class="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                                    {{ getInitials(submission.user?.name ?? 'An') }}
                                </AvatarFallback>
                            </Avatar>
                            <div class="min-w-0 flex-1">
                                <h4 class="font-display truncate text-base font-bold tracking-[-0.015em] text-foreground">
                                    {{ submission.user?.name ?? 'Anonymous' }}
                                </h4>
                                <p class="mt-1 truncate text-xs text-muted-foreground">
                                    {{ submission.user?.email ?? 'No email address' }}
                                </p>
                            </div>
                        </div>

                        <div class="flex-1 space-y-4 pt-5">
                            <div v-for="key in answerKeys" :key="key" class="space-y-1.5">
                                <div class="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    {{ humanizeKey(key) }}
                                </div>
                                <div class="text-xs leading-relaxed">
                                    <div v-if="fileUrl(submission.answers[key])" class="flex items-center gap-2 text-primary">
                                        <FileText class="size-4" />
                                        <span class="underline underline-offset-4">Attached Document</span>
                                    </div>
                                    <span v-else class="line-clamp-2 break-words text-foreground/85">
                                        {{ answerPreview(submission.answers[key]) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex flex-col gap-3">
                            <div class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                <span class="flex items-center gap-1.5"><Clock class="size-3" /> Submitted</span>
                                <span>{{ formatDate(submission.submitted_at) }}</span>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div class="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        class="gap-1.5 border-success/30 text-success hover:bg-success/10"
                                        @click="submissionReviewStub('accept', submission)"
                                    >
                                        <CheckCircle2 class="size-4" />
                                        Accept
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        class="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                                        @click="submissionReviewStub('reject', submission)"
                                    >
                                        <XCircle class="size-4" />
                                        Reject
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    class="w-full gap-2"
                                    @click="openDetail(submission)"
                                >
                                    <Eye class="size-4" />
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="submissions.links && submissions.last_page > 1"
                    class="flex items-center justify-center gap-1.5 pt-8"
                >
                    <Button
                        v-for="link in submissions.links"
                        :key="link.label"
                        variant="outline"
                        size="sm"
                        :class="[
                            'h-9 min-w-9',
                            link.active ? 'border-primary bg-primary/10 text-primary' : '',
                            !link.url ? 'opacity-40' : '',
                        ]"
                        :disabled="!link.url"
                        as-child
                    >
                        <Link v-if="link.url" :href="link.url">{{ paginationLabel(link.label) }}</Link>
                        <span v-else>{{ paginationLabel(link.label) }}</span>
                    </Button>
                </div>
            </template>
        </div>
    </div>

    <Sheet v-model:open="isDetailOpen">
        <SheetContent class="sm:max-w-md md:max-w-lg">
            <SheetHeader class="border-b border-border pb-6">
                <div class="flex items-center gap-4">
                    <Avatar class="size-14 rounded-2xl border border-border">
                        <AvatarFallback class="rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                            {{ getInitials(selectedSubmission?.user?.name ?? 'An') }}
                        </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1">
                        <SheetTitle class="font-display text-2xl font-bold tracking-[-0.025em] text-foreground">
                            Submission Details
                        </SheetTitle>
                        <SheetDescription class="mt-1.5 truncate text-sm text-muted-foreground">
                            From {{ selectedSubmission?.user?.name ?? 'Anonymous' }}
                        </SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <div class="mt-8 space-y-8 overflow-y-auto px-1 pb-20 pr-3">
                <section class="space-y-4">
                    <h5 class="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Member Information
                    </h5>
                    <div class="app-surface-soft space-y-4 p-5">
                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email Address</span>
                            <span class="text-sm font-semibold text-foreground">{{ selectedSubmission?.user?.email ?? 'No email provided' }}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Submitted At</span>
                            <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Clock class="size-4 text-muted-foreground" />
                                <span>{{ selectedSubmission ? formatDate(selectedSubmission.submitted_at) : '-' }}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="space-y-4">
                    <h5 class="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Form Responses
                    </h5>
                    <div class="grid grid-cols-1 gap-3">
                        <div
                            v-for="key in allAnswerKeys"
                            :key="key"
                            class="app-surface flex flex-col gap-2 p-5"
                        >
                            <span class="app-kicker">
                                {{ humanizeKey(key) }}
                            </span>
                            <div class="mt-1">
                                <a
                                    v-if="fileUrl(selectedSubmission?.answers[key])"
                                    :href="fileUrl(selectedSubmission?.answers[key]) ?? undefined"
                                    target="_blank"
                                    class="inline-flex items-center gap-2.5 font-semibold text-primary decoration-primary/30 underline underline-offset-4 transition-colors hover:decoration-primary"
                                >
                                    <div class="grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10">
                                        <FileText class="size-5" />
                                    </div>
                                    <span>Download Attachment</span>
                                </a>
                                <p v-else class="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                    {{ answerPreview(selectedSubmission?.answers[key]) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-if="selectedSubmission" class="space-y-3 border-t border-border pt-6">
                    <h5 class="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Review (preview)</h5>
                    <p class="text-xs leading-relaxed text-muted-foreground">
                        These actions only trigger a notification until the backend adds status columns and approve/reject routes.
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            class="min-w-[120px] flex-1 gap-2 border-success/30 text-success hover:bg-success/10"
                            variant="outline"
                            @click="submissionReviewStub('accept', selectedSubmission)"
                        >
                            <CheckCircle2 class="size-4" />
                            Accept
                        </Button>
                        <Button
                            type="button"
                            class="min-w-[120px] flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                            variant="outline"
                            @click="submissionReviewStub('reject', selectedSubmission)"
                        >
                            <XCircle class="size-4" />
                            Reject
                        </Button>
                    </div>
                </section>
            </div>
        </SheetContent>
    </Sheet>
</template>

