<script setup lang="ts">
import { computed, ref, watch, type ComponentPublicInstance } from 'vue';
import { router, useForm } from '@inertiajs/vue3';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';
import DataPagination from '@/components/modules/dashboard/DataPagination.vue';
import EmptyState from '@/components/modules/dashboard/EmptyState.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowRight, Check, X } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { CometSpinner } from '@/components/ui/comet';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorToast } from '@/hooks/useErrorToast';
import { routes } from '@/lib/routes';
import { PERIOD_APPLICANTS_PAGE_SIZE } from '@/lib/pagination';

const { handleInertiaFormErrors, showErrorToast, showFlashToast } = useErrorToast();

/** Satu-satunya definisi baris aplikan periode; diimpor oleh Periods/Show.vue. */
export interface TApplicationRow {
    id: string;
    registration_number: string;
    full_name: string;
    nim: string;
    semester: number;
    stage: string;
    stage_label: string;
    result: string;
    result_label: string;
    revision_required: boolean;
    submitted_at: string | null;
    primary_division: { id: string; name: string } | null;
    secondary_division: { id: string; name: string } | null;
    period: { id: string; name: string } | null;
}

const QUEUE_OPTIONS = [
    { key: '', label: 'Semua antrean' },
    { key: 'screening', label: 'Screening' },
    { key: 'revision', label: 'Revisi' },
    { key: 'interview', label: 'Interview' },
    { key: 'final', label: 'Final' },
    { key: 'done', label: 'Selesai' },
] as const;

const props = withDefaults(
    defineProps<{
        periodId: string;
        applications: TApplicationRow[] | null;
        queueCounts: Record<string, number>;
        divisionOptions: { id: string; name: string; code: string }[];
        stageOptions: { value: string; label: string }[];
        semesterOptions?: { value: string; label: string }[];
        tab: string;
        canScreen?: boolean;
        selectedId?: string | null;
        loading?: boolean;
        query?: {
            search?: string;
            division_id?: string;
            stage?: string;
            queue?: string;
            semester?: string;
            per_page?: string | number;
        };
    }>(),
    { semesterOptions: () => [], canScreen: false, loading: false, query: () => ({}) }
);

const emit = defineEmits<{
    select: [id: string];
    deselect: [];
}>();

const rowRefs = ref<Record<string, HTMLElement | null>>({});
let lastSelectedId: string | null = null;

function setRowRef(id: string, el: Element | ComponentPublicInstance | null): void {
    rowRefs.value[id] = el instanceof HTMLElement ? el : null;
}

const rowIds = computed<string[]>(() => pagedRows.value.map((row) => row.id));

function focusRowAt(index: number): void {
    const ids = rowIds.value;
    if (ids.length === 0) return;
    const clamped = Math.max(0, Math.min(ids.length - 1, index));
    rowRefs.value[ids[clamped] ?? '']?.focus();
}

function moveRowFocus(currentId: string, delta: number): void {
    const index = rowIds.value.indexOf(currentId);
    if (index === -1) return;
    focusRowAt(index + delta);
}

watch(
    () => props.selectedId,
    (value) => {
        if (value) {
            lastSelectedId = value;
            return;
        }
        const target = lastSelectedId ? rowRefs.value[lastSelectedId] : null;
        if (target) {
            target.focus();
        } else {
            const listEl = document.querySelector('[data-applicant-list]');
            if (listEl instanceof HTMLElement) {
                listEl.focus();
            }
        }
        lastSelectedId = null;
    }
);

const search = ref<string>('');
const divisionId = ref<string>('');
const stage = ref<string>('');
const queue = ref<string>('');
const semester = ref<string>('');
const perPage = ref<number>(PERIOD_APPLICANTS_PAGE_SIZE);
const currentPage = ref<number>(1);

const divisionSelectOptions = computed<SearchableSelectOption[]>(() => [
    { value: '', label: 'Semua divisi' },
    ...props.divisionOptions.map((division) => ({ value: division.id, label: division.name })),
]);

const queueSelectOptions = computed<SearchableSelectOption[]>(() =>
    QUEUE_OPTIONS.map((option) => {
        const count = option.key === '' ? (props.queueCounts.all ?? 0) : (props.queueCounts[option.key] ?? 0);
        return {
            value: option.key,
            label: count > 0 ? `${option.label} (${count})` : option.label,
        };
    })
);

const stageSelectOptions = computed<SearchableSelectOption[]>(() => [
    { value: '', label: 'Semua tahap' },
    ...props.stageOptions.map((option) => ({ value: option.value, label: option.label })),
]);

const semesterSelectOptions = computed<SearchableSelectOption[]>(() => {
    const options: SearchableSelectOption[] = [
        { value: '', label: 'Semua semester' },
        ...(props.semesterOptions ?? []).map((option) => ({ value: option.value, label: option.label })),
    ];

    const active = semester.value;
    if (active === '' || options.some((option) => option.value === active)) {
        return options;
    }

    return [...options, { value: active, label: /^\d+$/.test(active) ? `Semester ${active}` : active }];
});

const queueModel = computed<string>({
    get: () => queue.value,
    set: (value: string) => {
        queue.value = value;
        if (value) {
            stage.value = '';
        }
    },
});

function matchesQueue(row: TApplicationRow, activeQueue: string): boolean {
    switch (activeQueue) {
        case 'screening':
            return (
                (row.stage === 'submitted' || row.stage === 'screening') &&
                row.result === 'pending' &&
                !row.revision_required
            );
        case 'revision':
            return row.revision_required;
        case 'interview':
            return row.stage === 'interview';
        case 'final':
            return row.stage === 'final_review';
        case 'done':
            return row.stage === 'completed';
        default:
            return true;
    }
}

const filteredRows = computed<TApplicationRow[]>(() => {
    const needle: string = search.value.trim().toLowerCase();
    return (props.applications ?? []).filter((row) => {
        if (needle !== '') {
            const haystack: string = `${row.full_name} ${row.nim} ${row.registration_number}`.toLowerCase();
            if (!haystack.includes(needle)) return false;
        }
        if (
            divisionId.value !== '' &&
            row.primary_division?.id !== divisionId.value &&
            row.secondary_division?.id !== divisionId.value
        )
            return false;
        if (queue.value !== '') {
            if (!matchesQueue(row, queue.value)) return false;
        } else if (stage.value !== '' && row.stage !== stage.value) {
            return false;
        }
        if (semester.value !== '' && String(row.semester) !== semester.value) return false;
        return true;
    });
});

const totalCount = computed<number>(() => filteredRows.value.length);
const lastPage = computed<number>(() => Math.max(1, Math.ceil(totalCount.value / perPage.value)));

const pagedRows = computed<TApplicationRow[]>(() => {
    const page: number = Math.max(1, Math.min(currentPage.value, lastPage.value));
    const start: number = (page - 1) * perPage.value;
    return filteredRows.value.slice(start, start + perPage.value);
});

const perPageOptions = computed<SearchableSelectOption[]>(() =>
    [5, 10, 20, 50].map((size) => ({ value: String(size), label: `${size} / halaman` }))
);

const perPageModel = computed<string>({
    get: () => String(perPage.value),
    set: (value: string) => {
        perPage.value = Number(value) || PERIOD_APPLICANTS_PAGE_SIZE;
        currentPage.value = 1;
    },
});

const rangeStart = computed<number>(() => {
    if (totalCount.value === 0) return 0;
    return (Math.max(1, Math.min(currentPage.value, lastPage.value)) - 1) * perPage.value + 1;
});

const rangeEnd = computed<number>(() => {
    if (totalCount.value === 0) return 0;
    return Math.min(rangeStart.value + pagedRows.value.length - 1, totalCount.value);
});

watch([search, divisionId, stage, semester, queue], () => {
    currentPage.value = 1;
});

function goToPage(page: number): void {
    currentPage.value = Math.max(1, Math.min(page, lastPage.value));
}

interface IRejectReasonOption {
    value: string;
    label: string;
}

const REJECT_REASONS: IRejectReasonOption[] = [
    { value: 'incomplete_data', label: 'Data tidak lengkap' },
    { value: 'invalid_data', label: 'Data tidak valid' },
    { value: 'document_mismatch', label: 'Dokumen tidak sesuai' },
    { value: 'document_unreadable', label: 'Dokumen tidak dapat dibaca' },
    { value: 'info_mismatch', label: 'Informasi tidak sesuai' },
    { value: 'requirements_not_met', label: 'Persyaratan tidak terpenuhi' },
    { value: 'other', label: 'Lainnya' },
];

function canDecide(row: TApplicationRow): boolean {
    if (!props.canScreen) return false;
    if (row.revision_required) return false;
    if (row.result !== 'pending') return false;
    return row.stage === 'submitted' || row.stage === 'screening';
}

const processingId = ref<string | null>(null);
const passTarget = ref<TApplicationRow | null>(null);
const passDialogOpen = ref(false);

const rejectTarget = ref<TApplicationRow | null>(null);
const rejectDialogOpen = ref(false);
const rejectLocalError = ref<string | null>(null);
const rejectForm = useForm({
    reason: '',
    notes: '',
    public_message: '',
});

/**
 * Membaca pesan error non-field (mis. `application` dari ScreeningService) yang
 * bukan kunci form sehingga tidak tercakup tipe FormDataErrors.
 */
function crossCuttingError(errors: Record<string, string>, key: string): string | undefined {
    return errors[key];
}

const rejectApplicationError = computed<string | null>(() => {
    const message = crossCuttingError(rejectForm.errors, 'application');
    return message !== undefined && message.length > 0 ? message : null;
});

function openPass(row: TApplicationRow): void {
    if (!canDecide(row) || processingId.value !== null) return;
    passTarget.value = row;
    passDialogOpen.value = true;
}

function cancelPass(): void {
    passDialogOpen.value = false;
}

function confirmPass(): void {
    const target = passTarget.value;
    if (target === null || processingId.value !== null) return;
    processingId.value = target.id;
    router.post(
        routes.admin.recruitment.applications.screening.pass(target.id),
        {},
        {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                showFlashToast({ type: 'success', message: 'Applicant lolos screening.' });
            },
            onError: () => {
                showErrorToast('Gagal meloloskan applicant.');
            },
            onFinish: () => {
                processingId.value = null;
                passTarget.value = null;
                passDialogOpen.value = false;
            },
        }
    );
}

function openReject(row: TApplicationRow): void {
    if (!canDecide(row) || processingId.value !== null) return;
    rejectTarget.value = row;
    rejectForm.reset();
    rejectForm.clearErrors();
    rejectLocalError.value = null;
    rejectDialogOpen.value = true;
}

function closeReject(): void {
    rejectDialogOpen.value = false;
    rejectTarget.value = null;
    rejectLocalError.value = null;
    rejectForm.reset();
    rejectForm.clearErrors();
}

function submitReject(): void {
    const target = rejectTarget.value;
    if (target === null || rejectForm.processing) return;
    if (rejectForm.reason === '') {
        rejectLocalError.value = 'Alasan penolakan wajib diisi.';
        return;
    }
    if (rejectForm.reason === 'other' && rejectForm.notes.trim() === '') {
        rejectLocalError.value = 'Catatan wajib diisi jika alasan "Lainnya".';
        return;
    }
    rejectLocalError.value = null;
    processingId.value = target.id;
    rejectForm.post(routes.admin.recruitment.applications.screening.reject(target.id), {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
            showFlashToast({ type: 'success', message: 'Applicant ditolak pada tahap screening.' });
            closeReject();
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal menolak applicant.' });
        },
        onFinish: () => {
            processingId.value = null;
        },
    });
}
</script>

<template>
    <section class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Applicant periode ini</h2>
        </div>

        <div class="flex flex-wrap items-end gap-3">
            <Input v-model="search" placeholder="Cari nama, NIM, nomor pendaftaran..." class="max-w-xs" />
            <div class="flex min-w-0 flex-col gap-1.5">
                <SearchableSelect
                    v-model="divisionId"
                    :options="divisionSelectOptions"
                    id="filter-divisi"
                    class="h-10 w-full border-border/80 bg-background/80 text-xs sm:text-sm"
                    aria-label="Filter divisi"
                />
            </div>
            <div class="flex min-w-0 flex-col gap-1.5">
                <SearchableSelect
                    v-model="queueModel"
                    :options="queueSelectOptions"
                    id="filter-antrean"
                    class="h-10 w-full border-border/80 bg-background/80 text-xs sm:text-sm"
                    aria-label="Filter antrean"
                />
            </div>
            <div v-if="!queue" class="flex min-w-0 flex-col gap-1.5">
                <SearchableSelect
                    v-model="stage"
                    :options="stageSelectOptions"
                    id="filter-tahap"
                    class="h-10 w-full border-border/80 bg-background/80 text-xs sm:text-sm"
                    aria-label="Filter tahap"
                />
            </div>
            <div class="flex min-w-0 flex-col gap-1.5">
                <SearchableSelect
                    v-model="semester"
                    :options="semesterSelectOptions"
                    id="filter-semester"
                    class="h-10 w-full border-border/80 bg-background/80 text-xs sm:text-sm"
                    aria-label="Filter semester"
                />
            </div>
        </div>

        <Card
            v-if="applications"
            data-applicant-list
            tabindex="-1"
            class="overflow-hidden rounded-2xl border-border/70 focus-visible:outline-none"
        >
            <CardContent class="p-0">
                <div class="overflow-x-auto overflow-y-hidden">
                    <table class="w-full text-sm">
                        <thead class="border-b bg-muted/40 text-left">
                            <tr>
                                <th class="px-4 py-3 font-medium">Nomor</th>
                                <th class="px-4 py-3 font-medium">Nama</th>
                                <th class="px-4 py-3 font-medium">NIM</th>
                                <th class="px-4 py-3 font-medium">Divisi</th>
                                <th class="px-4 py-3 font-medium">Tahap</th>
                                <th class="px-4 py-3 font-medium">Status</th>
                                <th class="px-4 py-3"><span class="sr-only">Aksi</span></th>
                            </tr>
                        </thead>
                        <tbody v-if="!loading" class="fade-up">
                            <tr
                                v-for="row in pagedRows"
                                :key="row.id"
                                :ref="(el) => setRowRef(row.id, el)"
                                tabindex="0"
                                :aria-current="selectedId === row.id ? 'true' : undefined"
                                class="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset"
                                :class="selectedId === row.id ? 'bg-muted/40' : ''"
                                @click="emit('select', row.id)"
                                @keydown.enter.prevent="emit('select', row.id)"
                                @keydown.arrow-down.prevent="moveRowFocus(row.id, 1)"
                                @keydown.arrow-up.prevent="moveRowFocus(row.id, -1)"
                            >
                                <td class="px-4 py-3 font-mono text-xs">{{ row.registration_number }}</td>
                                <td class="px-4 py-3 font-medium">{{ row.full_name }}</td>
                                <td class="px-4 py-3">{{ row.nim }}</td>
                                <td class="px-4 py-3">{{ row.primary_division?.name ?? '—' }}</td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                        :class="
                                            row.revision_required
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-muted text-muted-foreground'
                                        "
                                    >
                                        {{ row.stage_label }}
                                        <span v-if="row.revision_required"> · Revisi</span>
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-muted-foreground">{{ row.result_label }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center justify-end gap-0.5">
                                        <Button
                                            v-if="canDecide(row)"
                                            radius="icon"
                                            variant="ghost"
                                            size="icon-sm"
                                            class="text-success hover:text-success"
                                            :aria-label="`Loloskan ${row.full_name}`"
                                            :disabled="processingId === row.id"
                                            :aria-busy="processingId === row.id"
                                            @click.stop="openPass(row)"
                                        >
                                            <CometSpinner v-if="processingId === row.id" :size="16" />
                                            <Check v-else class="size-4" aria-hidden="true" />
                                        </Button>
                                        <Button
                                            v-if="canDecide(row)"
                                            radius="icon"
                                            variant="ghost"
                                            size="icon-sm"
                                            class="text-destructive hover:text-destructive"
                                            :aria-label="`Tolak ${row.full_name}`"
                                            :disabled="processingId === row.id"
                                            :aria-busy="processingId === row.id"
                                            @click.stop="openReject(row)"
                                        >
                                            <CometSpinner v-if="processingId === row.id" :size="16" />
                                            <X v-else class="size-4" aria-hidden="true" />
                                        </Button>
                                        <Button
                                            radius="icon"
                                            variant="ghost"
                                            size="icon-sm"
                                            :aria-label="`Lihat detail ${row.full_name}`"
                                            @click.stop="emit('select', row.id)"
                                        >
                                            <ArrowRight class="size-4" aria-hidden="true" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="pagedRows.length === 0">
                                <td colspan="7" class="px-4 py-10">
                                    <EmptyState
                                        variant="inline"
                                        title="Belum ada applicant untuk periode ini yang cocok dengan filter."
                                    />
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else aria-busy="true" aria-label="Memuat aplikan">
                            <tr
                                v-for="n in 10"
                                :key="`aplikan-skel-${n}`"
                                class="applicant-row-skeleton border-b last:border-0"
                            >
                                <td class="px-4 py-3 font-mono text-xs">
                                    <Skeleton class="h-3 w-16" />
                                </td>
                                <td class="px-4 py-3">
                                    <Skeleton class="h-4 w-32" />
                                </td>
                                <td class="px-4 py-3">
                                    <Skeleton class="h-3 w-24" />
                                </td>
                                <td class="px-4 py-3">
                                    <Skeleton class="h-3 w-24" />
                                </td>
                                <td class="px-4 py-3">
                                    <Skeleton class="h-5 w-20 rounded-full" />
                                </td>
                                <td class="px-4 py-3">
                                    <Skeleton class="h-3 w-20" />
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center justify-end gap-0.5">
                                        <Skeleton class="size-7 shrink-0" />
                                        <Skeleton class="size-7 shrink-0" />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        <div
            v-if="applications && !loading"
            class="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex flex-wrap items-center gap-3">
                <p class="text-muted-foreground">
                    Menampilkan {{ rangeStart }}–{{ rangeEnd }} dari {{ totalCount }} applicant
                </p>
                <SearchableSelect
                    v-model="perPageModel"
                    :options="perPageOptions"
                    id="per-halaman"
                    class="h-8 w-36 text-xs"
                    aria-label="Jumlah per halaman"
                />
            </div>
            <DataPagination
                :edges="true"
                :page="currentPage"
                :total="totalCount"
                :per-page="perPage"
                @update:page="goToPage"
            />
        </div>

        <ConfirmationModal
            :open="passDialogOpen"
            title="Loloskan applicant?"
            :description="
                passTarget
                    ? `${passTarget.full_name} akan dipindahkan ke tahap interview.`
                    : 'Applicant akan dipindahkan ke tahap interview.'
            "
            confirm-text="Loloskan"
            :loading="passTarget !== null && processingId === passTarget.id"
            @confirm="confirmPass"
            @cancel="cancelPass"
            @update:open="
                (v: boolean) => {
                    passDialogOpen = v;
                }
            "
        />

        <Dialog v-model:open="rejectDialogOpen">
            <DialogContent class="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tolak applicant</DialogTitle>
                    <DialogDescription>
                        {{
                            rejectTarget
                                ? `Tolak ${rejectTarget.full_name}? Alasan wajib diisi.`
                                : 'Alasan penolakan wajib diisi.'
                        }}
                    </DialogDescription>
                </DialogHeader>

                <form class="space-y-4" @submit.prevent="submitReject">
                    <div class="space-y-2">
                        <Label for="quick-reject-reason">Alasan</Label>
                        <select
                            id="quick-reject-reason"
                            v-model="rejectForm.reason"
                            class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            required
                        >
                            <option value="" disabled>Pilih alasan</option>
                            <option v-for="opt in REJECT_REASONS" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                        <p v-if="rejectForm.errors.reason" class="text-xs text-destructive">
                            {{ rejectForm.errors.reason }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <Label for="quick-reject-notes">Catatan</Label>
                        <textarea
                            id="quick-reject-notes"
                            v-model="rejectForm.notes"
                            rows="3"
                            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Catatan internal untuk tim..."
                        />
                        <p v-if="rejectForm.errors.notes" class="text-xs text-destructive">
                            {{ rejectForm.errors.notes }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <Label for="quick-reject-public-message">Pesan untuk applicant (opsional)</Label>
                        <textarea
                            id="quick-reject-public-message"
                            v-model="rejectForm.public_message"
                            rows="2"
                            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <p v-if="rejectLocalError" class="text-xs text-destructive">
                        {{ rejectLocalError }}
                    </p>
                    <p v-if="rejectApplicationError" class="text-xs text-destructive">
                        {{ rejectApplicationError }}
                    </p>

                    <DialogFooter>
                        <Button type="button" variant="outline" @click="closeReject"> Batal </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            :disabled="rejectForm.processing"
                            :aria-busy="rejectForm.processing"
                        >
                            <CometSpinner v-if="rejectForm.processing" :size="16" />
                            {{ rejectForm.processing ? 'Menolak...' : 'Tolak applicant' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </section>
</template>
