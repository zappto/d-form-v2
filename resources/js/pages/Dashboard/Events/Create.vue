<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import axios from 'axios';
import { handleInertiaFormErrors } from '@/lib/error-message';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import EventDashboardForm from '@/components/modules/dashboard/events/EventDashboardForm.vue';
import FormBuilderWorkspace from '@/components/modules/builder/FormBuilderWorkspace.vue';
import ConfirmationModal from '@/components/core/ConfirmationModal.vue';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-vue-next';
import { setTopbar } from '@/utils/composables/useDashboardTopbar';
import { destroy as destroyEvent } from '@/actions/App/Http/Controllers/Dashboard/Events/EventController';
import { __invoke as postFields } from '@/actions/App/Http/Controllers/Dashboard/Events/Forms/FieldOperationController';
import {
    fromBackendField,
    toBackendFields,
    type BackendField,
} from '@/components/modules/builder/fieldMapping';
import {
    defaultFormBannerState,
    prependFormBannerToBackendPayload,
    extractFormBannerFromBuilderFields,
} from '@/components/modules/builder/formBanner';
import { emptyFormRegistrationMetadata, parseFormRegistrationMetadata } from '@/types/form';
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
    queryStep.value === 'forms' && queryDraftId.value && props.draftEvent ? 'forms' : 'event',
);

const draftEvent = computed<WizardDraftEvent | null>(() => props.draftEvent ?? null);
const draftForm = computed<WizardDraftForm | null>(() => draftEvent.value?.forms?.[0] ?? null);

onMounted(() => {
    setTopbar({ title: 'Buat acara', subtitle: 'Detail acara & formulir pendaftaran' });
});

// ── Step event → forms: setelah POST wizard, Inertia render ulang dgn draftEvent ──
watch(
    () => props.draftEvent?.id,
    (id) => {
        if (id && step.value === 'event') {
            const params: Record<string, string> = { step: 'forms', draftId: String(id) };
            router.get(routes.admin.events.create, params, { preserveState: false });
        }
    },
    { immediate: true },
);

// ── Step forms: builder state (hydrate dari draftForm) ──────────
const formTitle = ref<string>('');
const formDescription = ref<string>('');
const successContent = ref<string>('');
const closedAt = ref<string>('');
const visibleFor = ref<string[]>([]);
const bannerState = reactive(defaultFormBannerState());
const formFields = ref<BuilderField[]>([]);
const formMetadata = ref(emptyFormRegistrationMetadata());

function hydrateBuilder(): void {
    const f = draftForm.value;
    if (!f) return;
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
    bannerState.id = syntheticBanner.id;
    bannerState.bannerUrl = f.banner_url ?? syntheticBanner.bannerUrl;
    bannerState.caption = f.banner_caption ?? syntheticBanner.caption;
    bannerState.bannerFileName = syntheticBanner.bannerFileName;
    formFields.value = canvasFields;
}

watch(
    () => draftForm.value?.id,
    () => {
        if (step.value === 'forms') hydrateBuilder();
    },
    { immediate: true },
);

// ── Autosave fields (debounce 800ms) ────────────────────────────
const saveState = ref<'idle' | 'saving' | 'saved'>('idle');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let saveSeq = 0;

function flushFields(): Promise<void> {
    const formId = draftForm.value?.id;
    const eventId = draftEvent.value?.id;
    if (!formId || !eventId) return Promise.resolve();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    const seq = ++saveSeq;
    saveState.value = 'saving';
    const merged = prependFormBannerToBackendPayload(formFields.value, bannerState);
    const backend = toBackendFields(merged) as unknown as Record<string, unknown>[];

    return axios
        .post(postFields({ event: eventId, form: formId }).url, { fields: backend }, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then(() => {
            if (seq === saveSeq) saveState.value = 'saved';
        })
        .catch(() => {
            if (seq === saveSeq) saveState.value = 'idle';
        });
}

watch(
    () => JSON.stringify(formFields.value),
    () => {
        if (step.value !== 'forms' || !draftForm.value?.id) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            void flushFields();
        }, 800);
    },
);

/** Tunggu debounce tertunda selesai (dipakai sebelum navigasi Selesai). */
function flushPending(): Promise<void> {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
        return flushFields();
    }
    return Promise.resolve();
}

// ── Navigasi ────────────────────────────────────────────────────
function goBackToEvent(): void {
    const params: Record<string, string> = { step: 'event' };
    if (draftEvent.value?.id) params.draftId = String(draftEvent.value.id);
    router.get(routes.admin.events.create, params, { preserveState: false });
}

function goToForms(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId) return;
    router.get(routes.admin.events.create, { step: 'forms', draftId: String(eventId) }, { preserveState: false });
}

function clearDraftCache(): void {
    const id = draftEvent.value?.id;
    if (!id) return;
    try {
        localStorage.removeItem(`dform:draft:form:${id}`);
    } catch {
        /* localStorage tidak tersedia */
    }
}

// ── Selesai ─────────────────────────────────────────────────────
const finishing = ref(false);

function finishWizard(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId || finishing.value) return;
    finishing.value = true;
    void flushPending()
        .then(() => {
            clearDraftCache();
            router.visit(routes.admin.events.show(eventId));
        })
        .finally(() => {
            finishing.value = false;
        });
}

function skipWizard(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId) return;
    clearDraftCache();
    router.visit(routes.admin.events.show(eventId));
}

// ── Batalkan ────────────────────────────────────────────────────
const showCancelModal = ref(false);
const cancelBusy = ref(false);

function confirmCancel(): void {
    const eventId = draftEvent.value?.id;
    if (!eventId || cancelBusy.value) return;
    cancelBusy.value = true;
    clearDraftCache();
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

const saveStatusLabel = computed(() =>
    saveState.value === 'saving' ? 'Menyimpan…' : saveState.value === 'saved' ? 'Tersimpan' : '',
);
</script>

<template>
    <Head title="Buat acara" />

    <div class="flex flex-col gap-5">
        <!-- Step 1: detail event (stepper inline dgn tombol aksi via slot) -->
        <EventDashboardForm
            v-if="step === 'event'"
            :variant="draftEvent ? 'edit' : 'create'"
            :event="draftEvent ?? undefined"
            :options="options"
            :wizard-mode="!draftEvent"
        >
            <template #header-leading>
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <template v-for="(s, i) in steps" :key="s.key">
                        <div class="flex items-center gap-1.5">
                            <span
                                class="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
                                :class="
                                    i < currentIndex
                                        ? 'bg-success/15 text-success'
                                        : i === currentIndex
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                "
                            >
                                <CheckCircle2 v-if="i < currentIndex" class="size-3.5 stroke-[1.75]" />
                                <template v-else>{{ i + 1 }}</template>
                            </span>
                            <span
                                class="text-xs font-medium"
                                :class="i === currentIndex ? 'text-foreground' : 'text-muted-foreground'"
                            >
                                {{ s.label }}
                            </span>
                        </div>
                        <span v-if="i < steps.length - 1" class="text-muted-foreground/40">›</span>
                    </template>
                    <Button v-if="draftEvent" size="sm" class="ml-1" @click="goToForms">
                        Lanjutkan ke formulir
                    </Button>
                </div>
            </template>
        </EventDashboardForm>

        <!-- Step 2: formulir pendaftaran -->
        <template v-else-if="step === 'forms' && draftEvent">
            <!-- Satu baris: stepper kiri, aksi kanan -->
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <template v-for="(s, i) in steps" :key="s.key">
                        <div class="flex items-center gap-1.5">
                            <span
                                class="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
                                :class="
                                    i < currentIndex
                                        ? 'bg-success/15 text-success'
                                        : i === currentIndex
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground'
                                "
                            >
                                <CheckCircle2 v-if="i < currentIndex" class="size-3.5 stroke-[1.75]" />
                                <template v-else>{{ i + 1 }}</template>
                            </span>
                            <span
                                class="text-xs font-medium"
                                :class="i === currentIndex ? 'text-foreground' : 'text-muted-foreground'"
                            >
                                {{ s.label }}
                            </span>
                        </div>
                        <span v-if="i < steps.length - 1" class="text-muted-foreground/40">›</span>
                    </template>
                    <span
                        v-if="saveStatusLabel"
                        class="text-muted-foreground flex items-center gap-1.5 text-xs"
                    >
                        <Loader2 v-if="saveState === 'saving'" class="size-3 animate-spin" aria-hidden="true" />
                        <span v-else class="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        {{ saveStatusLabel }}
                    </span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" class="text-muted-foreground" @click="goBackToEvent">Kembali</Button>
                    <Button variant="ghost" class="text-muted-foreground" @click="skipWizard">
                        Lewati — buat nanti
                    </Button>
                    <Button
                        variant="outline"
                        class="border-destructive/30 text-destructive hover:bg-destructive/10"
                        @click="showCancelModal = true"
                    >
                        Batalkan
                    </Button>
                    <Button :disabled="finishing" @click="finishWizard">
                        <Loader2 v-if="finishing" class="size-4 animate-spin" aria-hidden="true" />
                        <template v-else>Selesai</template>
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
        @update:open="(v) => { if (!v) showCancelModal = false }"
    />
</template>
