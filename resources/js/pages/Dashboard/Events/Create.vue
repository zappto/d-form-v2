<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
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
import { setTopbar } from '@/hooks/useDashboardTopbar';
import { destroy as destroyEvent } from '@/actions/App/Http/Controllers/Dashboard/Events/EventController';
import FormAutosaveController from '@/actions/App/Http/Controllers/Dashboard/Events/Forms/FormAutosaveController';
import { __invoke as postFields } from '@/actions/App/Http/Controllers/Dashboard/Events/Forms/FieldOperationController';
import { useBuilderAutosave } from '@/hooks/useBuilderAutosave';
import { fromBackendField, type BackendField } from '@/components/modules/builder/fieldMapping';
import {
    defaultFormBannerState,
    extractFormBannerFromBuilderFields,
    hasPendingBannerFile,
} from '@/components/modules/builder/formBanner';
import { hasPendingOptionImageFiles } from '@/components/modules/builder/optionImage';
import { emptyFormRegistrationMetadata, parseFormRegistrationMetadata } from '@/types/form';
import {
    DESCRIPTION_REQUIRED_MESSAGE,
    TITLE_REQUIRED_MESSAGE,
    isBlankRequiredValue,
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
    window.addEventListener('beforeunload', builderAutosave.flushBeacon);
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

// ── Autosave global (optimistik + debounce 800ms): SEMUA mutasi builder ──
// Dideklarasikan sebelum hydrateBuilder karena watcher immediate di bawah
// memanggilnya saat registrasi.
const builderAutosave = useBuilderAutosave({
    getState: () => ({
        title: formTitle.value,
        description: formDescription.value,
        successContent: successContent.value,
        closedAt: closedAt.value,
        visibleFor: visibleFor.value,
        banner: bannerState.value,
        fields: formFields.value,
        metadata: formMetadata.value,
    }),
    // '' bila draft belum ada; save hook menjadi false tanpa request.
    resolveFieldsUrl: () => {
        const formId = draftForm.value?.id;
        const eventId = draftEvent.value?.id;
        if (!formId || !eventId) return '';
        return postFields({ event: eventId, form: formId }).url;
    },
    resolveAutosaveUrl: () => {
        const formId = draftForm.value?.id;
        const eventId = draftEvent.value?.id;
        if (!formId || !eventId) return '';
        return FormAutosaveController.patch({ event: eventId, form: formId }).url;
    },
    readEnabled: () => step.value === 'forms' && !!draftForm.value?.id,
    notifySaveError: () => toast.error('Gagal menyimpan otomatis. Perubahan tetap ada di kanvas.'),
});
const saveState = builderAutosave.status;
const flushPending = (): Promise<void> => builderAutosave.flush();

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
    // → jangan timpa kanvas (termasuk file pending yang dibuang hydrate via null).
    if (
        builderAutosave.evaluateHydrate(
            f.id,
            hasPendingBannerFile(bannerState.value) || hasPendingOptionImageFiles(formFields.value),
        )
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
    builderAutosave.registerHydrated(f.id);
}

watch(
    () => draftForm.value?.id,
    () => {
        if (step.value === 'forms') hydrateBuilder();
    },
    { immediate: true }
);

onUnmounted(() => {
    window.removeEventListener('beforeunload', builderAutosave.flushBeacon);
    void builderAutosave.flush();
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
                        <Button variant="destructive-outline" size="sm" @click="showCancelModal = true">
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
                    <Button variant="destructive-outline" @click="showCancelModal = true"> Batalkan </Button>
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
