<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { Head, useForm, Link } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import DraggableItem from '@/components/modules/builder/DraggableItem.vue';
import FieldRenderer from '@/components/modules/builder/FieldRenderer.vue';
import FieldEditor from '@/components/modules/builder/FieldEditor.vue';
import FormBannerSettings from '@/components/modules/builder/FormBannerSettings.vue';
import FormPreviewDialog from '@/components/modules/builder/FormPreviewDialog.vue';
import {
    fromBackendField,
    toBackendFields,
    type BackendField,
    type BuilderField,
} from '@/components/modules/builder/fieldMapping';
import {
    defaultFormBannerState,
    prependFormBannerToBackendPayload,
    extractFormBannerFromBuilderFields,
    normalizeBannerSrc,
    type FormBannerState,
} from '@/components/modules/builder/formBanner';
import {
    cloneFormBuilderPalette,
    ALL_FORM_BUILDER_FIELD_TEMPLATES,
    FORM_VISIBILITY_OPTIONS,
    type FormBuilderPaletteCategory,
} from '@/components/modules/builder/formBuilderPalette';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import LocalLottie from '@/components/core/LocalLottie.vue';
import {
    GripVertical,
    ChevronRight,
    Search,
    Eye,
    Save,
    Settings,
    Plus,
    ArrowLeft,
    FileText,
    Sparkles,
} from 'lucide-vue-next';

defineOptions({ layout: DashboardFocusLayout });

const props = defineProps<{
    event: { id: string; title: string };
    form: IForm;
    fields: BackendField[];
    saveFieldsUrl: string;
    updateFormUrl: string;
}>();

// ─── Field palette (shared) ────────────────────────────────────
const categories = ref<FormBuilderPaletteCategory[]>(cloneFormBuilderPalette());
const visibilityOptions = [...FORM_VISIBILITY_OPTIONS];

// ─── State ─────────────────────────────────────────────────────
const searchQuery = ref('');
const selectedFieldId = ref<string | null>(null);
const dropIndicatorIndex = ref(-1);
const isDraggingOverCanvas = ref(false);
const dragSourceId = ref<string | null>(null);
const activePanel = ref<'fields' | 'settings'>('fields'); // 'fields' | 'settings'
const showPreview = ref(false);

// Form settings
const settingsForm = useForm({
    _method: 'put',
    title: props.form.title,
    description: props.form.description,
    closed_at: props.form.closed_at ?? '',
    visible_for: [...props.form.visible_for],
    banner_url: props.form.banner_url ?? '',
    banner_caption: props.form.banner_caption ?? '',
});

/** Form banner (synced separately from draggable fields — persisted as synthetic field metadata). */
const bannerState = reactive(defaultFormBannerState());

// Builder fields (convert from backend)
const formFields = ref<BuilderField[]>([]);
function syncFieldsFromProps() {
    const raw: BackendField[] = JSON.parse(JSON.stringify(props.fields || []));
    raw.sort((a, b) => a.order - b.order);
    const mapped = raw.map((f) => fromBackendField(f));
    const { banner: syntheticBanner, canvasFields } = extractFormBannerFromBuilderFields(mapped);

    bannerState.id = syntheticBanner.id;
    bannerState.bannerUrl = props.form.banner_url ?? syntheticBanner.bannerUrl;
    bannerState.caption = props.form.banner_caption ?? syntheticBanner.caption;
    bannerState.bannerFileName = syntheticBanner.bannerFileName;

    formFields.value = canvasFields;
}

watch(
    () => props.fields,
    () => syncFieldsFromProps(),
    { immediate: true, deep: true }
);
watch(
    () => props.form,
    (f) => {
        settingsForm.title = f?.title;
        settingsForm.description = f?.description;
        settingsForm.closed_at = f?.closed_at ?? '';
        settingsForm.visible_for = [...f?.visible_for];
        settingsForm.banner_url = f?.banner_url ?? '';
        settingsForm.banner_caption = f?.banner_caption ?? '';
    },
    { deep: true }
);

// ─── Computed ──────────────────────────────────────────────────
const filteredCategories = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return categories.value;
    return categories.value
        .map((cat) => ({
            ...cat,
            isOpen: true,
            fields: cat.fields.filter((f) => f.label.toLowerCase().includes(q) || f.type.includes(q)),
        }))
        .filter((cat) => cat.fields.length > 0);
});
const selectedField = computed(() => formFields.value.find((f) => f.id === selectedFieldId.value) ?? null);
const isEmpty = computed(() => formFields.value.length === 0);
const mobileFieldType = ref('');
const allFieldTypes = ALL_FORM_BUILDER_FIELD_TEMPLATES;
const bannerPreviewSrc = computed(() => normalizeBannerSrc(bannerState.bannerUrl));

// ─── Field factory ─────────────────────────────────────────────
function addFieldFromPicker() {
    const picked = allFieldTypes.find((field) => field.type === mobileFieldType.value);
    if (!picked) return;
    const nf = createField(picked.type, picked.label);
    formFields.value.push(nf);
    selectedFieldId.value = nf.id;
    mobileFieldType.value = '';
}

function createField(type: string, label: string): BuilderField {
    const defaults: Record<string, Partial<BuilderField>> = {
        dropdown: { metadata: { options: 'Option 1, Option 2' } },
        checkbox: { metadata: { options: 'Choice A, Choice B, Choice C' } },
        radio: { metadata: { options: 'Option 1, Option 2, Option 3' } },
        rating: { metadata: { maxStars: 5 } },
        heading: { metadata: { content: 'Section Heading' } },
        image_upload: { metadata: { accepts: 'png, jpg, jpeg' } },
        file_upload: { metadata: { accepts: 'pdf, doc, xls' } },
    };
    return {
        id: crypto.randomUUID(),
        type,
        label: label || 'Untitled Field',
        name: `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        description: '',
        order: 0,
        metadata: {},
        ...(defaults[type] || {}),
    } as BuilderField;
}

// ─── DnD: Sidebar → Canvas ────────────────────────────────────
function onGapDragEnter(index: number) {
    dropIndicatorIndex.value = index;
}
function onCanvasDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = isDraggingOverCanvas.value ? 'move' : 'copy';
    }
    if (dropIndicatorIndex.value === -1 && isEmpty.value) dropIndicatorIndex.value = 0;
}
function onCanvasDragLeave(e: DragEvent) {
    if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        dropIndicatorIndex.value = -1;
        isDraggingOverCanvas.value = false;
    }
}
function onCanvasDrop(e: DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer?.getData('application/json');
    if (!raw) return;
    const data = JSON.parse(raw);
    const insertAt = dropIndicatorIndex.value < 0 ? formFields.value.length : dropIndicatorIndex.value;
    if (data.isNew) {
        const nf = createField(data.type, data.label);
        formFields.value.splice(insertAt, 0, nf);
        selectedFieldId.value = nf.id;
    } else {
        const from = formFields.value.findIndex((f) => f.id === data.id);
        if (from === -1) return;
        const [moved] = formFields.value.splice(from, 1);
        formFields.value.splice(insertAt > from ? insertAt - 1 : insertAt, 0, moved);
        selectedFieldId.value = moved.id;
    }
    dropIndicatorIndex.value = -1;
    isDraggingOverCanvas.value = false;
    dragSourceId.value = null;
}
function onCanvasDragStart(e: DragEvent, field: BuilderField, index: number) {
    dragSourceId.value = field.id;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ id: field.id, fromIndex: index, isNew: false }));
    }
    requestAnimationFrame(() => {
        isDraggingOverCanvas.value = true;
    });
}
function onDragEnd() {
    dropIndicatorIndex.value = -1;
    isDraggingOverCanvas.value = false;
    dragSourceId.value = null;
}

// ─── Field actions ─────────────────────────────────────────────
function selectField(id: string) {
    selectedFieldId.value = selectedFieldId.value === id ? null : id;
    activePanel.value = 'fields';
}
function deleteField(id: string) {
    formFields.value = formFields.value.filter((f) => f.id !== id);
    if (selectedFieldId.value === id) selectedFieldId.value = null;
}
function duplicateField(id: string) {
    const i = formFields.value.findIndex((f) => f.id === id);
    if (i === -1) return;
    const copy: BuilderField = {
        ...JSON.parse(JSON.stringify(formFields.value[i])),
        id: crypto.randomUUID(),
        label: `${formFields.value[i].label} (copy)`,
        name: `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    };
    formFields.value.splice(i + 1, 0, copy);
    selectedFieldId.value = copy.id;
}
function updateField(updated: BuilderField) {
    const i = formFields.value.findIndex((f) => f.id === updated.id);
    if (i !== -1) formFields.value[i] = updated;
}
function toggleCategory(idx: number) {
    categories.value[idx].isOpen = !categories.value[idx].isOpen;
}
function toggleVisibility(value: string, checked: boolean) {
    const isChecked = checked === true;
    if (isChecked) {
        if (!settingsForm.visible_for.includes(value)) settingsForm.visible_for = [...settingsForm.visible_for, value];
    } else {
        settingsForm.visible_for = settingsForm.visible_for.filter((v) => v !== value);
    }
}

// ─── Save actions ──────────────────────────────────────────────
function saveAll() {
    settingsForm.banner_url = bannerState.bannerUrl;
    settingsForm.banner_caption = bannerState.caption;

    // Prepare fields for backend
    const merged = prependFormBannerToBackendPayload(formFields.value, bannerState);
    const backendFields = toBackendFields(merged);

    // Send in one unified request
    settingsForm
        .transform((data) => ({
            ...data,
            fields: backendFields,
        }))
        .put(props.updateFormUrl, {
            preserveScroll: true,
            onSuccess: () => toast.success('Form and fields saved successfully.'),
        });
}
</script>

<template>
    <Head :title="`Edit: ${form.title}`" />
    <div class="flex h-[calc(100svh-3.5rem)] flex-col overflow-hidden lg:flex-row">
        <!-- LEFT SIDEBAR -->
        <aside class="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card lg:flex">
            <div class="flex border-b border-border">
                <button
                    class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors"
                    :class="activePanel === 'fields' ? 'border-b-2 border-primary text-foreground' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'"
                    @click="activePanel = 'fields'"
                >
                    <Sparkles class="size-3.5" />Components
                </button>
                <button
                    class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors"
                    :class="activePanel === 'settings' ? 'border-b-2 border-primary text-foreground' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'"
                    @click="activePanel = 'settings'"
                >
                    <Settings class="size-3.5" />Settings
                </button>
            </div>

            <!-- Components panel -->
            <div v-show="activePanel === 'fields'" class="flex flex-1 flex-col overflow-hidden">
                <div class="px-3 pt-3 pb-2">
                    <div class="relative">
                        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search components..."
                            class="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-8 text-xs font-medium text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                        />
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto px-3 pb-3">
                    <div v-for="(cat, ci) in filteredCategories" :key="cat.name" class="mb-3 last:mb-0">
                        <button
                            class="mb-1.5 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                            @click="toggleCategory(ci)"
                        >
                            <ChevronRight class="size-3 shrink-0 transition-transform duration-200" :class="cat.isOpen ? 'rotate-90' : ''" />
                            <component :is="cat.icon" class="size-3.5 shrink-0" />{{ cat.name }}
                            <span class="ml-auto text-[10px] font-medium text-muted-foreground">{{ cat.fields.length }}</span>
                        </button>
                        <div v-show="cat.isOpen" class="flex flex-col gap-1.5">
                            <DraggableItem v-for="f in cat.fields" :key="f.type" v-bind="f" />
                        </div>
                    </div>
                    <div v-if="filteredCategories.length === 0" class="flex flex-col items-center py-8 text-center">
                        <Search class="mb-2 size-8 text-muted-foreground/50" />
                        <p class="text-xs font-medium text-muted-foreground">No components found</p>
                    </div>
                </div>
            </div>

            <!-- Settings panel -->
            <div v-show="activePanel === 'settings'" class="flex-1 overflow-y-auto px-4 py-4">
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1.5">
                        <Label class="text-xs font-semibold">Title</Label>
                        <Input v-model="settingsForm.title" class="text-xs" />
                        <p v-if="settingsForm.errors.title" class="text-destructive text-[10px]">
                            {{ settingsForm.errors.title }}
                        </p>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <Label class="text-xs font-semibold">Description</Label>
                        <textarea
                            v-model="settingsForm.description"
                            rows="3"
                            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus-visible:ring-2 focus-visible:outline-none"
                        ></textarea>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <Label class="text-xs font-semibold">Closes at</Label>
                        <Input v-model="settingsForm.closed_at" type="datetime-local" class="text-xs" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <Label class="text-xs font-semibold">Visible for</Label>
                        <div
                            v-for="opt in visibilityOptions"
                            :key="opt.value"
                            class="flex cursor-pointer items-center gap-2 text-xs"
                        >
                            <Checkbox
                                :checked="settingsForm.visible_for.includes(opt.value)"
                                @update:checked="(v: boolean) => toggleVisibility(opt.value, v)"
                            />
                            <span>{{ opt.label }}</span>
                        </div>
                    </div>
                    <FormBannerSettings
                        :model-value="bannerState"
                        @update:model-value="(value: FormBannerState) => Object.assign(bannerState, value)"
                    />
                    <p class="text-[10px] leading-relaxed text-muted-foreground">
                        Save banner alongside form structure using
                        <span class="font-semibold text-foreground">Save All</span> above.
                    </p>
                </div>
            </div>
        </aside>

        <!-- CENTER CANVAS -->
        <main class="bg-background relative flex-1 overflow-y-auto">
            <div class="border-b border-border bg-muted/30 px-4 py-3 lg:hidden">
                <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Add field on mobile</label>
                <div class="flex gap-2">
                    <select
                        v-model="mobileFieldType"
                        class="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                    >
                        <option value="">Choose field type</option>
                        <option v-for="fieldType in allFieldTypes" :key="fieldType.type" :value="fieldType.type">
                            {{ fieldType.label }}
                        </option>
                    </select>
                    <Button size="sm" class="h-9 shrink-0 text-xs" :disabled="!mobileFieldType" @click="addFieldFromPicker">
                        <Plus class="mr-1 size-3.5" />Add
                    </Button>
                </div>
            </div>

            <div class="sticky top-0 z-20 border-b border-border bg-card/85 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-2">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <Link
                            :href="`/dashboard/events/${event.id}/forms`"
                            class="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-transparent px-3 text-xs font-semibold tracking-tight text-foreground transition-all hover:border-border hover:bg-accent hover:shadow-sm"
                        >
                            <ArrowLeft class="size-3.5" />
                            Back
                        </Link>
                        <span class="min-w-0 truncate text-xs font-semibold text-foreground">
                            {{ settingsForm.title || 'Untitled' }}
                        </span>
                        <span class="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {{ formFields.length }} field{{ formFields.length !== 1 ? 's' : '' }}
                        </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        <Link
                            :href="`/dashboard/events/${event.id}/forms/${form.id}/submissions`"
                            class="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold tracking-tight text-foreground shadow-sm transition-all hover:-translate-y-px hover:bg-accent active:scale-[0.98]"
                        >
                            <FileText class="size-3.5" />
                            Submissions
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            class="h-8 shrink-0 text-xs whitespace-nowrap"
                            :disabled="formFields.length === 0"
                            @click="showPreview = true"
                        >
                            <Eye class="mr-1 size-3.5" />Preview
                        </Button>
                        <Button
                            size="sm"
                            class="h-8 shrink-0 text-xs whitespace-nowrap"
                            :disabled="settingsForm.processing"
                            @click="saveAll"
                        >
                            <Save class="mr-1 size-3.5" />Save All
                        </Button>
                    </div>
                </div>
            </div>
            <div class="flex justify-center px-3 py-6 sm:px-6 sm:py-8">
                <div class="w-full max-w-full sm:max-w-[420px]">
                    <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div
                            v-if="bannerPreviewSrc || bannerState.caption.trim()"
                            class="border-b border-border bg-muted/30"
                        >
                            <img v-if="bannerPreviewSrc" :src="bannerPreviewSrc" alt="" class="aspect-3/1 w-full object-cover" />
                            <p v-if="bannerState.caption.trim()" class="px-5 py-3 text-[12px] leading-relaxed text-muted-foreground">
                                {{ bannerState.caption }}
                            </p>
                        </div>
                        <div class="border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-primary/0 px-5 pt-6 pb-5">
                            <h2 class="font-display text-xl font-bold tracking-[-0.02em] text-foreground">
                                {{ settingsForm.title || 'Untitled Form' }}
                            </h2>
                            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                                {{ settingsForm.description || 'No description' }}
                            </p>
                        </div>
                        <div
                            class="min-h-[400px] px-4 py-4"
                            :class="[
                                isEmpty && !isDraggingOverCanvas ? 'flex items-center justify-center' : '',
                                isDraggingOverCanvas && isEmpty ? 'bg-primary/[0.03]' : '',
                            ]"
                            @dragover.prevent="onCanvasDragOver"
                            @dragleave="onCanvasDragLeave"
                            @drop="onCanvasDrop"
                        >
                            <div v-if="isEmpty && !isDraggingOverCanvas" class="flex flex-col items-center py-6 text-center">
                                <div class="mb-4 rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-8">
                                    <LocalLottie name="builderEmpty" :height="140" :width="140" />
                                </div>
                                <h3 class="font-display text-base font-bold tracking-[-0.01em] text-foreground">Start building your form</h3>
                                <p class="mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                                    Drag components from the left panel and drop them here.
                                </p>
                                <div class="mt-4 flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5">
                                    <GripVertical class="size-3.5 text-muted-foreground/70" />
                                    <span class="text-[10px] font-medium text-muted-foreground">Tip: Drag the handle to reorder fields</span>
                                </div>
                            </div>
                            <div
                                v-if="isEmpty && isDraggingOverCanvas"
                                class="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/[0.05] transition-colors"
                            >
                                <div class="grid size-10 place-items-center rounded-full bg-primary/10">
                                    <Plus class="size-5 text-primary" />
                                </div>
                                <p class="mt-2 text-xs font-semibold text-primary">Drop here to add</p>
                            </div>
                            <!-- Field list -->
                            <div v-if="!isEmpty" class="flex flex-col">
                                <template v-for="(field, index) in formFields" :key="field.id">
                                    <div
                                        class="relative py-0.5"
                                        @dragenter.prevent="onGapDragEnter(index)"
                                        @dragover.prevent
                                    >
                                        <div
                                            class="pointer-events-none h-0.5 rounded-full transition-all duration-200"
                                            :class="
                                                dropIndicatorIndex === index
                                                    ? 'bg-primary shadow-sm'
                                                    : 'bg-transparent'
                                            "
                                        ></div>
                                    </div>
                                    <div class="group relative" :class="dragSourceId === field.id ? 'opacity-30' : ''">
                                        <div
                                            class="absolute top-1/2 -left-1 z-10 -translate-x-full -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                                            draggable="true"
                                            @dragstart="(e) => onCanvasDragStart(e, field, index)"
                                            @dragend="onDragEnd"
                                        >
                                            <div class="grid size-7 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:border-primary/30 hover:text-foreground">
                                                <GripVertical class="size-4" />
                                            </div>
                                        </div>
                                        <FieldRenderer
                                            :field="field"
                                            :is-selected="selectedFieldId === field.id"
                                            @select="selectField(field.id)"
                                            @delete="deleteField(field.id)"
                                            @duplicate="duplicateField(field.id)"
                                        />
                                    </div>
                                </template>
                                <div
                                    class="relative py-0.5"
                                    @dragenter.prevent="onGapDragEnter(formFields.length)"
                                    @dragover.prevent
                                >
                                    <div
                                        class="pointer-events-none h-0.5 rounded-full transition-all duration-200"
                                        :class="
                                            dropIndicatorIndex === formFields.length
                                                ? 'bg-primary shadow-sm'
                                                : 'bg-transparent'
                                        "
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="mt-4 text-center text-[10px] text-muted-foreground/70">
                        Form preview · Mobile size (420px). On mobile, use the add-field dropdown above.
                    </p>
                </div>
            </div>
        </main>

        <aside class="hidden w-[300px] shrink-0 flex-col border-l border-border bg-card lg:flex">
            <div class="border-b border-border px-4 pt-4 pb-3">
                <h2 class="font-display text-sm font-semibold tracking-[-0.01em] text-foreground">Properties</h2>
                <p class="mt-0.5 text-[10px] text-muted-foreground">
                    {{ selectedField ? 'Edit the selected field' : 'Select a field to edit' }}
                </p>
            </div>
            <div class="flex-1 overflow-y-auto px-4 py-4">
                <FieldEditor v-if="selectedField" :field="selectedField" @update:field="updateField" />
                <div v-else class="flex h-full flex-col items-center justify-center text-center">
                    <div class="rounded-2xl border border-dashed border-border bg-muted/30 p-6">
                        <LocalLottie name="fieldSelected" :height="100" :width="100" />
                    </div>
                    <p class="mt-4 text-xs font-semibold text-foreground">No field selected</p>
                    <p class="mt-1 max-w-[200px] text-[10px] leading-relaxed text-muted-foreground">
                        Select a field in the canvas to edit its properties here.
                    </p>
                </div>
            </div>
        </aside>
    </div>

    <FormPreviewDialog
        :open="showPreview"
        :title="settingsForm.title || 'Untitled Form'"
        :description="settingsForm.description"
        :form-banner-url="bannerState.bannerUrl"
        :form-banner-caption="bannerState.caption"
        :fields="formFields"
        @close="showPreview = false"
    />
</template>
