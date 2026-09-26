<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import axios from 'axios';
import { handleInertiaFormErrors } from '@/lib/error-message';
import { toast } from 'vue-sonner';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import EventDashboardForm from '@/components/modules/dashboard/events/EventDashboardForm.vue';
import EventWizardStepper from '@/components/modules/dashboard/events/EventWizardStepper.vue';
import FormBuilderWorkspace from '@/components/modules/builder/FormBuilderWorkspace.vue';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import { AutosaveStatus } from '@/components/ui/autosave-status';
import { setTopbar } from '@/utils/composables/useDashboardTopbar';
import { destroy as destroyEvent } from '@/actions/App/Http/Controllers/Dashboard/Events/EventController';
import FormAutosaveController from '@/actions/App/Http/Controllers/Dashboard/Events/Forms/FormAutosaveController';
import { __invoke as postFields } from '@/actions/App/Http/Controllers/Dashboard/Events/Forms/FieldOperationController';
import { useAutosaveSync } from '@/utils/composables/useAutosaveSync';
import { fromBackendField, toBackendFields, type BackendField } from '@/components/modules/builder/fieldMapping';
import { diffBackendFields, snapshotBackendFields } from '@/components/modules/builder/dirtyFields';
import {
    buildUnloadPayload,
    shouldSkipHydrate,
} from '@/components/modules/builder/autosaveGuard';
import {
    applyBannerUploadSuccess,
    buildBannerFieldsFormData,
    defaultFormBannerState,
    ensureBannerRowDirty,
    extractFormBannerFromBuilderFields,
    hasPendingBannerFile,
    pendingBannerSnapshotKey,
    prependFormBannerToBackendPayload,
    readBannerPathFromResponse,
} from '@/components/modules/builder/formBanner';
import {
    applyOptionImageUploadSuccess,
    buildOptionImageFieldsFormData,
    collectPendingOptionImageFiles,
    discardPendingOptionImageFiles,
    ensureOptionImageRowsDirty,
    hasPendingOptionImageFiles,
    pendingOptionImagesSnapshotKey,
    readOptionImagePathsFromResponse,
} from '@/components/modules/builder/optionImage';
import { emptyFormRegistrationMetadata, parseFormRegistrationMetadata, toFormMetadataPayload } from '@/types/form';
import {
    DESCRIPTION_REQUIRED_MESSAGE,
    TITLE_REQUIRED_MESSAGE,
    isBlankRequiredValue,
    mergeSentHeader,
    stripBlankRequiredKeys,
} from '@/lib/autosaveHeader';
import type { BuilderField } from '@/types/form-builder';
import { routes } from '@/lib/routes';

defineOptions({ layout: DashboardFocusLayout });

interface WizardDraftForm {
    id: string;
    title: string;
    description: string;
    success_content: string | null;
    closed_at: string | null;
    visible_for: string[];
    banner_url: string | null;
    banner_caption: string | null;
    metadata: unknown;
    fields: BackendField[];
}

interface WizardDraftEvent extends IEvent {
    forms: WizardDraftForm[];
}

const props = defineProps<{
    options?: {
        categories: { value: string; label: string }[];
        sessions: { value: string; label: string }[];
    };
    draftEvent?: WizardDraftEvent;
}>();

const page = usePage();

const queryStep = computed(() => new URLSearchParams(page.url.split('?')[1] ?? '').get('step') ?? 'event');
const queryDraftId = computed(() => new URLSearchParams(page.url.split('?')[1] ?? '').get('draftId') ?? '');

const step = ref<'event' | 'forms'>(
    queryStep.value === 'forms' && queryDraftId.value && props.draftEvent ? 'forms' : 'event'
);

const draftEvent = computed<WizardDraftEvent | null>(() => props.draftEvent ?? null);
const draftForm = computed<WizardDraftForm | null>(() => draftEvent.value?.forms?.[0] ?? null);
const eventFormRef = ref<InstanceType<typeof EventDashboardForm> | null>(null);

onMounted(() => {
    setTopbar({ title: 'Buat acara', subtitle: 'Detail acara & formulir pendaftaran' });
    window.addEventListener('beforeunload', handleBeforeUnload);
});

// ── Step event → forms: setelah POST wizard, Inertia render ulang dgn draftEvent ──
// Guard: hanya auto-pindah saat draft baru dibuat (oldId falsy), bukan saat
// user sengaja kembali ke step event via goBackToEvent (?step=event&draftId=...).
watch(
    () => props.draftEvent?.id,
    (id, oldId) => {
        if (id && !oldId && step.value === 'event') {
            const params: Record<string, string> = { step: 'forms', draftId: String(id) };
            router.get(routes.admin.events.create, params, { preserveState: false });
        }
    }
);

// ── Step forms: builder state (hydrate dari draftForm) ──────────
const formTitle = ref<string>('');
const formDescription = ref<string>('');
const successContent = ref<string>('');
const closedAt = ref<string>('');
const visibleFor = ref<string[]>([]);
const bannerState = ref(defaultFormBannerState());
const formFields = ref<BuilderField[]>([]);
const formMetadata = ref(emptyFormRegistrationMetadata());

/** Header autosave yang dinormalisasi persis seperti payload PATCH yang dikirim. */
interface AutosaveHeaderPayload {
    title: string;
    description: string;
    success_content: string | null;
    closed_at: string | null;
    visible_for: string[];
    banner_url: string | null;
    banner_caption: string | null;
    metadata: Record<string, unknown>;
}

function buildHeaderPayload(): AutosaveHeaderPayload {
    return {
        title: formTitle.value,
        description: formDescription.value,
        success_content: successContent.value,
        closed_at: closedAt.value.trim() !== '' ? closedAt.value : null,
        visible_for: [...visibleFor.value],
        banner_url: bannerState.value.bannerUrl || null,
        banner_caption: bannerState.value.caption || null,
        metadata: toFormMetadataPayload(formMetadata.value),
    };
}

/**
 * Snapshot header terakhir yang sukses terkirim. PATCH hanya mengirim key yang
 * berubah (diff per-key) — hemat payload + tidak menulis null ke kolom NOT NULL
 * (mis. description '' → null oleh ConvertEmptyStringsToNull).
 */
const lastSentHeader = ref<AutosaveHeaderPayload | null>(null);

// Snapshot backend terakhir yang sukses terkirim (per id) untuk dirty-subset.
// Dideklarasikan sebelum hydrateBuilder karena watcher immediate di bawah
// memanggil hydrateBuilder saat registrasi.
const lastSentFields = ref<BackendField[] | null>(null);

// Guard hydrate anti-timpa (Fase 1-B): id draft terakhir yang dihydrate +
// snapshot bersih terakhir (setelah hydrate/save-sukses). Draft id SAMA +
// snapshot saat ini berbeda (mutasi lokal belum tersimpan) → lewati hydrate.
// Mount segar / id berubah → hydrate normal.
const lastHydratedFormId = ref<string | null>(null);
const lastCleanSnapshot = ref<string | null>(null);

function diffHeaderPayload(current: AutosaveHeaderPayload): Partial<AutosaveHeaderPayload> {
    const prev: AutosaveHeaderPayload | null = lastSentHeader.value;
    if (prev === null) return { ...current };
    const diff: Partial<AutosaveHeaderPayload> = {};
    (Object.keys(current) as Array<keyof AutosaveHeaderPayload>).forEach((key: keyof AutosaveHeaderPayload) => {
        if (JSON.stringify(current[key]) !== JSON.stringify(prev[key])) {
            (diff as Record<string, unknown>)[key] = current[key];
        }
    });
    return diff;
}

/**
 * Invalid inline untuk required yang dikosongkan (pola render mengikuti
 * field-error builder yang sudah ada, mis. visible_for). Invalid saja bukan
 * error autosave: key blank dikecualikan dari PATCH sehingga tak ada toast
 * error; saat diisi valid kembali, invalid hilang dan key ikut PATCH
 * berikutnya via diff per-key.
 */
const fieldErrors = computed(() => ({
    title: isBlankRequiredValue(formTitle.value) ? TITLE_REQUIRED_MESSAGE : undefined,
    description: isBlankRequiredValue(formDescription.value) ? DESCRIPTION_REQUIRED_MESSAGE : undefined,
}));

function hydrateBuilder(): void {
    const f = draftForm.value;
    if (!f) return;
    // Guard anti-timpa: draft id SAMA + mutasi lokal belum tersimpan sukses
    // → jangan timpa kanvas (termasuk bannerFile / file opsi pending yang
    // dibuang hydrate via null). Mount segar / id berubah tetap hydrate.
    if (
        shouldSkipHydrate({
            lastHydratedId: lastHydratedFormId.value,
            currentId: f.id,
            lastCleanSnapshot: lastCleanSnapshot.value,
            currentSnapshot: buildBuilderSnapshot(),
            hasPendingBannerFile:
                hasPendingBannerFile(bannerState.value) || hasPendingOptionImageFiles(formFields.value),
        })
    ) {
        return;
    }
    formTitle.value = f.title;
    formDescription.value = f.description ?? '';
    successContent.value = f.success_content ?? '';
    closedAt.value = f.closed_at ?? '';
    visibleFor.value = [...(f.visible_for ?? [])];
    formMetadata.value = parseFormRegistrationMetadata(f.metadata);

    const raw: BackendField[] = JSON.parse(JSON.stringify(f.fields ?? []));
    raw.sort((a, b) => a.order - b.order);
    const mapped = raw.map((bf) => fromBackendField(bf));
    const { banner: syntheticBanner, canvasFields } = extractFormBannerFromBuilderFields(mapped);
    bannerState.value.id = syntheticBanner.id;
    bannerState.value.bannerUrl = f.banner_url ?? syntheticBanner.bannerUrl;
    bannerState.value.caption = f.banner_caption ?? syntheticBanner.caption;
    bannerState.value.bannerFileName = syntheticBanner.bannerFileName;
    bannerState.value.bannerFile = null;
    bannerState.value.bannerPreviewUrl = '';
    bannerState.value.order = syntheticBanner.order ?? null;
    formFields.value = canvasFields;
    lastSentHeader.value = buildHeaderPayload();
    lastSentFields.value = snapshotBackendFields(
        toBackendFields(prependFormBannerToBackendPayload(formFields.value, bannerState.value)),
    );
    lastHydratedFormId.value = f.id;
    lastCleanSnapshot.value = buildBuilderSnapshot();
}

watch(
    () => draftForm.value?.id,
    () => {
        if (step.value === 'forms') hydrateBuilder();
    },
    { immediate: true }
);

// ── Autosave global (optimistik + debounce 800ms): SEMUA mutasi builder ──
function buildBuilderSnapshot(): string {
    return JSON.stringify({
        fields: formFields.value,
        title: formTitle.value,
        description: formDescription.value,
        bannerUrl: bannerState.value.bannerUrl,
        bannerCaption: bannerState.value.caption,
        bannerFileName: bannerState.value.bannerFileName,
        bannerPending: pendingBannerSnapshotKey(bannerState.value),
        optionImagesPending: pendingOptionImagesSnapshotKey(formFields.value),
        success: successContent.value,
        closedAt: closedAt.value,
        visibleFor: visibleFor.value,
        metadata: formMetadata.value,
    });
}

// Snapshot backend terakhir yang sukses terkirim (per id). POST /fields hanya
// berisi baris tambah/edit (termasuk yang order-nya berubah) + deleted_ids
// eksplisit; steady-empty = nol request, transisi ke kosong = full-delete.
// Banner baru dikirim sebagai multipart (part banner_file + fields
// JSON-string), bukan base64 — DB hanya menyimpan path.
// Order spaced: existing dipertahankan via lastSent sehingga insert depan
// hanya mengotori baris baru (anti order-shift).
async function saveBuilderSnapshot(snapshot?: string): Promise<boolean> {
    void snapshot;
    const formId = draftForm.value?.id;
    const eventId = draftEvent.value?.id;
    if (!formId || !eventId) return false;
    const merged = prependFormBannerToBackendPayload(formFields.value, bannerState.value);
    const backend = toBackendFields(merged, lastSentFields.value);
    const fieldDiff = diffBackendFields(backend, lastSentFields.value);
    const pendingBannerFile = hasPendingBannerFile(bannerState.value)
        ? (bannerState.value.bannerFile as File)
        : null;
    const pendingOptionFiles = collectPendingOptionImageFiles(formFields.value);
    let dirty = fieldDiff.dirty;
    let hasFieldChanges = fieldDiff.hasChanges;
    if (pendingBannerFile) {
        dirty = ensureBannerRowDirty(backend, dirty);
        hasFieldChanges = true;
    }
    if (pendingOptionFiles.length > 0) {
        dirty = ensureOptionImageRowsDirty(backend, dirty);
        hasFieldChanges = true;
    }
    if (hasFieldChanges) {
        if (pendingBannerFile || pendingOptionFiles.length > 0) {
            const formData =
                pendingOptionFiles.length === 0 && pendingBannerFile
                    ? buildBannerFieldsFormData(dirty, fieldDiff.deletedIds, pendingBannerFile)
                    : buildOptionImageFieldsFormData(
                          dirty,
                          fieldDiff.deletedIds,
                          pendingOptionFiles,
                          pendingBannerFile,
                      );
            const res = await axios.post(postFields({ event: eventId, form: formId }).url, formData, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const storedPath = readBannerPathFromResponse(res.data);
            if (storedPath) {
                applyBannerUploadSuccess(bannerState.value, storedPath, pendingBannerFile?.name);
            } else if (pendingBannerFile) {
                bannerState.value.bannerFile = null;
                bannerState.value.bannerPreviewUrl = '';
            }
            const storedOptionMap = readOptionImagePathsFromResponse(res.data);
            if (storedOptionMap) {
                applyOptionImageUploadSuccess(formFields.value, storedOptionMap);
            } else if (pendingOptionFiles.length > 0) {
                discardPendingOptionImageFiles(formFields.value);
            }
        } else {
            await axios.post(
                postFields({ event: eventId, form: formId }).url,
                { fields: dirty, deleted_ids: fieldDiff.deletedIds },
                { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } },
            );
        }
        lastSentFields.value = snapshotBackendFields(
            toBackendFields(
                prependFormBannerToBackendPayload(formFields.value, bannerState.value),
                lastSentFields.value,
            ),
        );
    }
    // Header parsial via PATCH lenient: hanya key yang berubah dibanding snapshot
    // sukses terakhir (hemat payload + hindari tulis null ke kolom NOT NULL).
    // Title/description yang kosong/blank dikecualikan dari payload (bukan
    // ''/null) + ditandai invalid inline — '' yang terkirim hanya akan
    // dilewati server lalu terlihat "resurrect" diam-diam saat reload.
    // Clear banner tetap menolkan kolom banner_url/banner_caption di save yang
    // sama dengan hapus baris field banner. Dibangun SETELAH upload banner
    // agar banner_url baru ikut terkirim dalam save yang sama.
    const header: AutosaveHeaderPayload = buildHeaderPayload();
    const headerDiff: Partial<AutosaveHeaderPayload> = stripBlankRequiredKeys(diffHeaderPayload(header), header);
    if (Object.keys(headerDiff).length > 0) {
        await axios.patch(
            FormAutosaveController.patch({ event: eventId, form: formId }).url,
            headerDiff,
            { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } },
        );
        lastSentHeader.value = mergeSentHeader(lastSentHeader.value, header, headerDiff);
        lastCleanSnapshot.value = buildBuilderSnapshot();
        return true;
    }
    if (hasFieldChanges) {
        lastCleanSnapshot.value = buildBuilderSnapshot();
    }
    return hasFieldChanges;
}

const autosaveEnabled = computed(() => step.value === 'forms' && !!draftForm.value?.id);
const autosave = useAutosaveSync(buildBuilderSnapshot, saveBuilderSnapshot, {
    debounceMs: 800,
    enabled: autosaveEnabled,
    onError: () => toast.error('Gagal menyimpan otomatis. Perubahan tetap ada di kanvas.'),
});
const saveState = autosave.status;
const flushPending = (): Promise<void> => autosave.flush();

/** Baca XSRF-TOKEN untuk CSRF beacon (Laravel cek input `_token`). */
function readXsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Flush unload anti data-loss (Fase 1-A): kirim snapshot saat ini via
 * navigator.sendBeacon (full fields + deleted_ids terkini, fire-and-forget;
 * sendBeacon tak bisa baca respons — itu diterima). Banner file pending tak
 * bisa ikut via beacon (tanpa multipart) — field lain tetap terselamatkan.
 * Didaftarkan sekali per mount, dibersihkan saat unmount.
 */
function handleBeforeUnload(): void {
    const formId = draftForm.value?.id;
    const eventId = draftEvent.value?.id;
    if (!formId || !eventId) return;
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    try {
        const payload = buildUnloadPayload({
            canvasFields: formFields.value,
            banner: bannerState.value,
            lastSent: lastSentFields.value,
        });
        if (!payload) return;
        const url = postFields({ event: eventId, form: formId }).url;
        const token = readXsrfToken();
        const body = JSON.stringify({
            fields: payload.fields,
            deleted_ids: payload.deleted_ids,
            ...(token ? { _token: token } : {}),
        });
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
    } catch {
        /* fire-and-forget: abaikan */
    }
}

onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    void autosave.flush();
});

// ── Navigasi ────────────────────────────────────────────────────
function goBackToEvent(): void {
    const params: Record<string, string> = { step: 'event' };
    if (draftEvent.value?.id) params.draftId = String(draftEvent.value.id);
    router.get(routes.admin.events.create, params, { preserveState: false });
}

function goToForms(): void {
    const api = eventFormRef.value as unknown as {
        validateRequired?: () => boolean;
        submitForm?: (publish: boolean) => void;
    } | null;

    if (!draftEvent.value) {
        if (api?.validateRequired && !api.validateRequired()) return;
        api?.submitForm?.(false);
        return;
    }

    if (api?.validateRequired && !api.validateRequired()) return;

    const eventId = draftEvent.value?.id;
    if (!eventId) return;
    router.get(routes.admin.events.create, { step: 'forms', draftId: String(eventId) }, { preserveState: false });
}

// ── Selesai ─────────────────────────────────────────────────────
const finishing = ref(false);

function finishWizard(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId || finishing.value) return;
    finishing.value = true;
    void flushPending()
        .then(() => {
            router.visit(routes.admin.events.show(eventId));
        })
        .finally(() => {
            finishing.value = false;
        });
}

function skipWizard(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId) return;
    router.visit(routes.admin.events.show(eventId));
}

// ── Batalkan ────────────────────────────────────────────────────
const showCancelModal = ref(false);
const cancelBusy = ref(false);

function confirmCancel(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId || cancelBusy.value) return;
    cancelBusy.value = true;
    router.delete(destroyEvent({ event: eventId }).url, {
        onSuccess: () => {
            // BE redirect ke index — Inertia mengikuti; fallback bila URL belum berubah.
            if (page.url !== routes.admin.events.index) {
                router.visit(routes.admin.events.index);
            }
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal membatalkan' });
        },
        onFinish: () => {
            cancelBusy.value = false;
            showCancelModal.value = false;
        },
    });
}

// ── Stepper header ──────────────────────────────────────────────
const steps = [
    { key: 'event', label: 'Detail acara' },
    { key: 'forms', label: 'Formulir pendaftaran' },
];
const currentIndex = computed(() => (step.value === 'forms' ? 1 : 0));

</script>

<template>
    <Head title="Buat acara" />

    <div class="flex flex-col gap-5">
        <!-- Step 1: detail event (stepper inline dgn tombol aksi via slot) -->
        <EventDashboardForm
            v-if="step === 'event'"
            ref="eventFormRef"
            :variant="draftEvent ? 'edit' : 'create'"
            :event="draftEvent ?? undefined"
            :options="options"
            :wizard-mode="true"
        >
            <template #header-leading>
                <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
                    <EventWizardStepper :steps="steps" :active-index="currentIndex" />
                    <div class="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            class="border-destructive/30 text-destructive hover:bg-destructive/10"
                            @click="showCancelModal = true"
                        >
                            Batalkan
                        </Button>
                        <Button size="sm" class="shrink-0" @click="goToForms"> Lanjutkan </Button>
                    </div>
                </div>
            </template>
        </EventDashboardForm>

        <!-- Step 2: formulir pendaftaran -->
        <template v-else-if="step === 'forms' && draftEvent">
            <!-- Satu baris: stepper kiri, aksi kanan -->
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div class="flex min-w-0 items-center gap-4">
                    <EventWizardStepper :steps="steps" :active-index="currentIndex" />
                    <AutosaveStatus :status="saveState" variant="inline" />
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Button variant="outline" @click="goBackToEvent">Kembali ke event</Button>
                    <Button variant="outline" @click="skipWizard">Lewati</Button>
                    <Button
                        variant="outline"
                        class="border-destructive/30 text-destructive hover:bg-destructive/10"
                        @click="showCancelModal = true"
                    >
                        Batalkan
                    </Button>
                    <Button :disabled="finishing" :aria-busy="finishing" @click="finishWizard">
                        <CometSpinner v-if="finishing" :size="16" />
                        {{ finishing ? 'Menyimpan...' : 'Selesai' }}
                    </Button>
                </div>
            </div>

            <FormBuilderWorkspace
                v-model:form-title="formTitle"
                v-model:form-description="formDescription"
                v-model:success-content="successContent"
                v-model:closed-at="closedAt"
                v-model:visible-for="visibleFor"
                v-model:banner="bannerState"
                v-model:form-fields="formFields"
                v-model:form-metadata="formMetadata"
                :event="{ id: draftEvent.id, title: draftEvent.title }"
                :toolbar-subtitle="`Formulir pendaftaran · ${draftEvent.title}`"
                save-label="Selesai"
                :processing="finishing"
                :hide-toolbar-titles="true"
                :field-errors="fieldErrors"
                @save="finishWizard"
            />
        </template>
    </div>

    <ConfirmationModal
        :open="showCancelModal"
        title="Batalkan pembuatan?"
        description="Event draf akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirm-text="Hapus draf"
        cancel-text="Batal"
        variant="destructive"
        :loading="cancelBusy"
        @confirm="confirmCancel"
        @cancel="showCancelModal = false"
        @update:open="
            (v) => {
                if (!v) showCancelModal = false;
            }
        "
    />
</template>
