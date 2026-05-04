<script setup lang="ts">
import 'vue-sonner/style.css'
import { ref, reactive, computed } from 'vue'
import { Head, useForm, Link } from '@inertiajs/vue3'
import { toast } from 'vue-sonner'
import { Toaster } from '@/components/ui/sonner'
import DraggableItem from '@/components/modules/builder/DraggableItem.vue'
import FieldRenderer from '@/components/modules/builder/FieldRenderer.vue'
import FieldEditor from '@/components/modules/builder/FieldEditor.vue'
import FormBannerSettings from '@/components/modules/builder/FormBannerSettings.vue'
import FormPreviewDialog from '@/components/modules/builder/FormPreviewDialog.vue'
import {
    defaultFormBannerState,
    normalizeBannerSrc,
    prependFormBannerToBackendPayload,
} from '@/components/modules/builder/formBanner'
import {
    cloneFormBuilderPalette,
    FORM_VISIBILITY_OPTIONS,
    type FormBuilderPaletteCategory,
    type FormBuilderPaletteField,
} from '@/components/modules/builder/formBuilderPalette'
import { toBackendFields } from '@/components/modules/builder/fieldMapping'
import type { BuilderField } from '@/types/form-builder'
import type { CreateDashboardFormPayload } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import LocalLottie from '@/components/core/LocalLottie.vue'
import {
    GripVertical,
    ChevronRight,
    Search,
    Save,
    Eye,
    Settings,
    Plus,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Trash2,
    Pencil,
    Check,
    Sparkles,
    Layers,
    SlidersHorizontal,
} from 'lucide-vue-next'

defineOptions({ layout: false })

const props = defineProps<{
    event: { id: string; title: string }
}>()

type InspectorMode = 'settings' | 'field'
type MobileTab = 'build' | 'settings'

const categories = ref<FormBuilderPaletteCategory[]>(cloneFormBuilderPalette())
const visibilityOptions = [...FORM_VISIBILITY_OPTIONS]

const searchQuery = ref<string>('')
const selectedFieldId = ref<string | null>(null)
const dropIndicatorIndex = ref<number>(-1)
const isDraggingOverCanvas = ref<boolean>(false)
const dragSourceId = ref<string | null>(null)
const inspectorMode = ref<InspectorMode>('settings')
const mobileTab = ref<MobileTab>('build')
const showAddSheet = ref<boolean>(false)
const showMobileEditor = ref<boolean>(false)
const showPreview = ref<boolean>(false)

const formTitle = ref<string>('')
const formDescription = ref<string>('')
const closedAt = ref<string>('')
const visibleFor = ref<string[]>([])
const formFields = ref<BuilderField[]>([])
const bannerState = reactive(defaultFormBannerState())
const isSaving = ref<boolean>(false)

const filteredCategories = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return categories.value
    return categories.value
        .map((cat) => ({
            ...cat,
            isOpen: true,
            fields: cat.fields.filter(
                (f) =>
                    f.label.toLowerCase().includes(q) ||
                    f.description.toLowerCase().includes(q) ||
                    f.type.includes(q),
            ),
        }))
        .filter((cat) => cat.fields.length > 0)
})

const selectedField = computed<BuilderField | null>(
    () => formFields.value.find((f) => f.id === selectedFieldId.value) ?? null,
)

const isEmpty = computed<boolean>(() => formFields.value.length === 0)
const bannerPreviewSrc = computed<string>(() => normalizeBannerSrc(bannerState.bannerUrl))

interface ValidationIssue {
    key: 'title' | 'description' | 'closedAt' | 'visibleFor' | 'fields'
    label: string
}

const validationIssues = computed<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = []
    if (!formTitle.value.trim()) issues.push({ key: 'title', label: 'Form title' })
    if (!formDescription.value.trim()) issues.push({ key: 'description', label: 'Description' })
    if (!closedAt.value) issues.push({ key: 'closedAt', label: 'Close date' })
    if (visibleFor.value.length === 0) issues.push({ key: 'visibleFor', label: 'Visibility' })
    if (formFields.value.length === 0) issues.push({ key: 'fields', label: 'At least one field' })
    return issues
})

const isReadyToSave = computed<boolean>(() => validationIssues.value.length === 0)

function createField(type: FormBuilderType, label: string): BuilderField {
    const defaults: Partial<Record<FormBuilderType, Partial<BuilderField>>> = {
        short_text: { placeholder: 'Enter answer...' },
        long_text: { placeholder: 'Enter detailed answer...' },
        dropdown: { options: [{ id: crypto.randomUUID(), type: 'text', label: 'Option 1' }] },
        checkbox: { options: [{ id: crypto.randomUUID(), type: 'text', label: 'Choice A' }] },
        radio: { options: [{ id: crypto.randomUUID(), type: 'text', label: 'Radio 1' }] },
        rating: { metadata: { maxStars: 5 } },
        heading: { metadata: { content: 'Section Heading' } },
        paragraph: { metadata: { content: 'Description text goes here...' } },
    }
    const base: BuilderField = {
        id: crypto.randomUUID(),
        type,
        label: label || 'Untitled Field',
        name: `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        description: '',
        placeholder: '',
        required: false,
        options: [],
        metadata: {},
    }
    return { ...base, ...(defaults[type] || {}) }
}

function addField(template: FormBuilderPaletteField, openEditorAfter = false): void {
    const nf = createField(template.type, template.label)
    formFields.value.push(nf)
    selectedFieldId.value = nf.id
    inspectorMode.value = 'field'
    showAddSheet.value = false
    if (openEditorAfter) showMobileEditor.value = true
}

function selectField(id: string, isMobile = false): void {
    if (selectedFieldId.value === id && !isMobile) {
        selectedFieldId.value = null
        inspectorMode.value = 'settings'
        return
    }
    selectedFieldId.value = id
    inspectorMode.value = 'field'
    if (isMobile) showMobileEditor.value = true
}

function deleteField(id: string): void {
    formFields.value = formFields.value.filter((f) => f.id !== id)
    if (selectedFieldId.value === id) {
        selectedFieldId.value = null
        inspectorMode.value = 'settings'
        showMobileEditor.value = false
    }
}

function duplicateField(id: string): void {
    const i = formFields.value.findIndex((f) => f.id === id)
    if (i === -1) return
    const copy = JSON.parse(JSON.stringify(formFields.value[i])) as BuilderField
    copy.id = crypto.randomUUID()
    copy.name = `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    formFields.value.splice(i + 1, 0, copy)
    selectedFieldId.value = copy.id
    inspectorMode.value = 'field'
}

function updateField(updated: BuilderField): void {
    const i = formFields.value.findIndex((f) => f.id === updated.id)
    if (i !== -1) formFields.value[i] = updated
}

function moveField(id: string, direction: -1 | 1): void {
    const i = formFields.value.findIndex((f) => f.id === id)
    if (i === -1) return
    const target = i + direction
    if (target < 0 || target >= formFields.value.length) return
    const [moved] = formFields.value.splice(i, 1)
    formFields.value.splice(target, 0, moved)
}

function toggleVisibility(value: string, checked: boolean): void {
    if (checked) visibleFor.value = [...visibleFor.value, value]
    else visibleFor.value = visibleFor.value.filter((v) => v !== value)
}

function onGapDragEnter(index: number): void {
    dropIndicatorIndex.value = index
}

function onCanvasDragOver(e: DragEvent): void {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = isDraggingOverCanvas.value ? 'move' : 'copy'
    if (dropIndicatorIndex.value === -1 && isEmpty.value) dropIndicatorIndex.value = 0
}

function onCanvasDragLeave(e: DragEvent): void {
    if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        dropIndicatorIndex.value = -1
        isDraggingOverCanvas.value = false
    }
}

function onCanvasDrop(e: DragEvent): void {
    e.preventDefault()
    const raw = e.dataTransfer?.getData('application/json')
    if (!raw) return
    const data = JSON.parse(raw) as { isNew?: boolean; type?: string; label?: string; id?: string }
    const insertAt = dropIndicatorIndex.value < 0 ? formFields.value.length : dropIndicatorIndex.value
    if (data.isNew && data.type && data.label) {
        const nf = createField(data.type as FormBuilderType, data.label)
        formFields.value.splice(insertAt, 0, nf)
        selectedFieldId.value = nf.id
        inspectorMode.value = 'field'
    } else if (data.id) {
        const from = formFields.value.findIndex((f) => f.id === data.id)
        if (from === -1) return
        const [moved] = formFields.value.splice(from, 1)
        formFields.value.splice(insertAt > from ? insertAt - 1 : insertAt, 0, moved)
        selectedFieldId.value = moved.id
        inspectorMode.value = 'field'
    }
    dropIndicatorIndex.value = -1
    isDraggingOverCanvas.value = false
    dragSourceId.value = null
}

function onCanvasDragStart(e: DragEvent, field: BuilderField, index: number): void {
    dragSourceId.value = field.id
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('application/json', JSON.stringify({ id: field.id, fromIndex: index, isNew: false }))
    }
    requestAnimationFrame(() => {
        isDraggingOverCanvas.value = true
    })
}

function onDragEnd(): void {
    dropIndicatorIndex.value = -1
    isDraggingOverCanvas.value = false
    dragSourceId.value = null
}

const createForm = useForm<CreateDashboardFormPayload>({
    title: '',
    description: '',
    closed_at: '',
    visible_for: [],
    banner_url: '',
    banner_caption: '',
    fields: [],
})

function saveNewForm(): void {
    if (validationIssues.value.length > 0) {
        toast.error(`Missing: ${validationIssues.value.map((i) => i.label).join(', ')}`)
        mobileTab.value = 'settings'
        inspectorMode.value = 'settings'
        return
    }
    createForm.title = formTitle.value
    createForm.description = formDescription.value
    createForm.closed_at = closedAt.value
    createForm.visible_for = visibleFor.value
    createForm.banner_url = bannerState.bannerUrl
    createForm.banner_caption = bannerState.caption

    const merged = prependFormBannerToBackendPayload(formFields.value, bannerState)
    createForm.fields = toBackendFields(merged)

    isSaving.value = true
    createForm.post(`/dashboard/events/${props.event.id}/forms`, {
        forceFormData: true,
        onSuccess: () => toast.success('Form created successfully!'),
        onError: (err) => {
            isSaving.value = false
            const first = Object.values(err)[0]
            toast.error(typeof first === 'string' ? first : 'Failed to create form.')
        },
    })
}
</script>

<template>
    <Head title="Create Form" />

    <div class="flex h-svh flex-col overflow-hidden">
        <!-- ════════════════════════════════════════════════════════
             TOP TOOLBAR — shared between desktop & mobile
             ════════════════════════════════════════════════════════ -->
        <header class="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card/85 px-3 py-2.5 backdrop-blur-xl sm:px-5">
            <div class="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="icon-sm" class="rounded-lg" as-child>
                    <Link :href="`/dashboard/events/${props.event.id}/forms`" aria-label="Back to forms list">
                        <ArrowLeft class="size-4" />
                    </Link>
                </Button>
                <div class="min-w-0">
                    <p class="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        New form for {{ event.title }}
                    </p>
                    <h1 class="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
                        {{ formTitle || 'Untitled form' }}
                    </h1>
                </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
                <span
                    class="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline-flex"
                    :class="
                        isReadyToSave
                            ? 'border-success/20 bg-success/10 text-success'
                            : 'border-warning/20 bg-warning/10 text-warning'
                    "
                >
                    <span class="size-1.5 rounded-full bg-current" />
                    {{ isReadyToSave ? 'Ready' : `${validationIssues.length} missing` }}
                </span>
                <Button variant="outline" size="sm" :disabled="isEmpty" @click="showPreview = true">
                    <Eye class="size-4 sm:mr-2" />
                    <span class="hidden sm:inline">Preview</span>
                </Button>
                <Button size="sm" :disabled="isSaving" @click="saveNewForm">
                    <Save class="size-4 sm:mr-2" />
                    <span class="hidden sm:inline">Save Form</span>
                </Button>
            </div>
        </header>

        <!-- ════════════════════════════════════════════════════════
             MOBILE TAB SWITCHER
             ════════════════════════════════════════════════════════ -->
        <div class="border-b border-border bg-card lg:hidden">
            <Tabs v-model="mobileTab" class="px-3 py-2">
                <TabsList class="w-full">
                    <TabsTrigger value="build" class="flex-1 gap-1.5">
                        <Layers class="size-3.5" />
                        Build
                        <span
                            class="ml-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold tabular-nums leading-none"
                        >
                            {{ formFields.length }}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" class="flex-1 gap-1.5">
                        <SlidersHorizontal class="size-3.5" />
                        Settings
                        <span
                            v-if="!isReadyToSave"
                            class="ml-1 grid size-4 place-items-center rounded-full bg-warning/15 text-[9px] font-bold leading-none text-warning"
                        >
                            !
                        </span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        <!-- ════════════════════════════════════════════════════════
             MAIN BODY
             ════════════════════════════════════════════════════════ -->
        <div class="flex flex-1 overflow-hidden">
            <!-- ─── Desktop palette (lg+) ─── -->
            <aside
                class="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card lg:flex"
                aria-label="Component palette"
            >
                <div class="border-b border-border px-4 pt-4 pb-3">
                    <h2 class="font-display flex items-center gap-1.5 text-sm font-semibold tracking-[-0.01em] text-foreground">
                        <Sparkles class="size-4 text-primary" />
                        Components
                    </h2>
                    <p class="mt-0.5 text-[10px] text-muted-foreground">Drag a block onto the canvas</p>
                    <div class="relative mt-3">
                        <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search components..."
                            class="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-8 text-xs font-medium text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                        />
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto px-3 py-3">
                    <div v-for="cat in filteredCategories" :key="cat.name" class="mb-3 last:mb-0">
                        <button
                            type="button"
                            class="mb-1.5 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                            @click="cat.isOpen = !cat.isOpen"
                        >
                            <ChevronRight class="size-3 shrink-0 transition-transform duration-200" :class="cat.isOpen ? 'rotate-90' : ''" />
                            <component :is="cat.icon" class="size-3.5 shrink-0" />
                            {{ cat.name }}
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
            </aside>

            <!-- ─── Canvas (desktop + mobile build tab) ─── -->
            <main class="relative min-h-0 flex-1 overflow-y-auto bg-background">
                <!-- Mobile: hide canvas when on Settings tab -->
                <div :class="['flex justify-center px-3 pt-6 pb-32 sm:px-6 lg:pb-10', mobileTab === 'settings' && 'hidden lg:flex']">
                    <div class="w-full max-w-[440px]">
                        <!-- Quick add hint when empty (desktop only) -->
                        <div
                            v-if="isEmpty"
                            class="mb-4 hidden items-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground lg:flex"
                        >
                            <Sparkles class="size-3.5 shrink-0 text-primary" />
                            Drag any component from the left to start. You can reorder anytime.
                        </div>

                        <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <!-- Banner preview -->
                            <div v-if="bannerPreviewSrc" class="border-b border-border">
                                <img :src="bannerPreviewSrc" alt="Form banner" class="aspect-[3/1] w-full object-cover" />
                            </div>
                            <!-- Header preview -->
                            <div class="border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-primary/0 px-5 pt-6 pb-5">
                                <input
                                    v-model="formTitle"
                                    placeholder="Untitled form"
                                    class="w-full bg-transparent font-display text-2xl font-bold tracking-[-0.025em] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                                />
                                <textarea
                                    v-model="formDescription"
                                    rows="2"
                                    placeholder="Add a short description so registrants know what this form is for..."
                                    class="mt-2 w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                                ></textarea>
                            </div>

                            <!-- Field list -->
                            <div
                                class="min-h-[400px] space-y-1 p-4"
                                @dragover.prevent="onCanvasDragOver"
                                @dragleave="onCanvasDragLeave"
                                @drop="onCanvasDrop"
                            >
                                <!-- Empty state -->
                                <div
                                    v-if="isEmpty && !isDraggingOverCanvas"
                                    class="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <LocalLottie name="builderEmpty" :height="120" :width="120" class="opacity-80" />
                                    <p class="mt-4 text-sm font-semibold text-foreground">Your canvas is empty</p>
                                    <p class="mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                                        <span class="hidden lg:inline">Drag components from the left to add them.</span>
                                        <span class="lg:hidden">Tap the button below to add your first field.</span>
                                    </p>
                                    <Button size="sm" class="mt-5 lg:hidden" @click="showAddSheet = true">
                                        <Plus class="mr-1.5 size-4" />
                                        Add field
                                    </Button>
                                </div>

                                <!-- DnD drop hint when dragging over empty canvas (desktop) -->
                                <div
                                    v-if="isEmpty && isDraggingOverCanvas"
                                    class="hidden min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/[0.05] transition-colors lg:flex"
                                >
                                    <div class="grid size-10 place-items-center rounded-full bg-primary/10">
                                        <Plus class="size-5 text-primary" />
                                    </div>
                                    <p class="mt-2 text-xs font-semibold text-primary">Drop here to add</p>
                                </div>

                                <!-- Field cards -->
                                <template v-for="(field, index) in formFields" :key="field.id">
                                    <!-- Drop indicator (desktop DnD) -->
                                    <div
                                        class="relative hidden h-1 w-full lg:block"
                                        @dragenter.prevent="onGapDragEnter(index)"
                                        @dragover.prevent
                                    >
                                        <div
                                            class="pointer-events-none h-0.5 rounded-full transition-all duration-200"
                                            :class="dropIndicatorIndex === index ? 'bg-primary' : 'bg-transparent'"
                                        ></div>
                                    </div>

                                    <div class="group relative" :class="dragSourceId === field.id ? 'opacity-30' : ''">
                                        <!-- Desktop drag handle -->
                                        <div class="absolute -left-10 top-1/2 hidden -translate-y-1/2 lg:block">
                                            <div
                                                class="grid size-7 cursor-grab place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:border-primary/30 hover:text-foreground active:cursor-grabbing"
                                                draggable="true"
                                                @dragstart="(e) => onCanvasDragStart(e, field, index)"
                                                @dragend="onDragEnd"
                                                aria-label="Drag to reorder"
                                            >
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

                                        <!-- Mobile inline action bar -->
                                        <div
                                            class="mt-1.5 flex items-center justify-between gap-1 rounded-lg border border-border bg-muted/30 px-1.5 py-1 lg:hidden"
                                        >
                                            <div class="flex items-center gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    :disabled="index === 0"
                                                    aria-label="Move field up"
                                                    @click="moveField(field.id, -1)"
                                                >
                                                    <ArrowUp class="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    :disabled="index === formFields.length - 1"
                                                    aria-label="Move field down"
                                                    @click="moveField(field.id, 1)"
                                                >
                                                    <ArrowDown class="size-4" />
                                                </Button>
                                            </div>
                                            <div class="flex items-center gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    class="h-8 gap-1 px-2 text-[11px] font-semibold"
                                                    @click="selectField(field.id, true)"
                                                >
                                                    <Pencil class="size-3.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    aria-label="Delete field"
                                                    @click="deleteField(field.id)"
                                                >
                                                    <Trash2 class="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </template>

                                <!-- Trailing drop zone (desktop) -->
                                <div
                                    v-if="!isEmpty"
                                    class="hidden h-4 w-full lg:block"
                                    @dragenter.prevent="onGapDragEnter(formFields.length)"
                                />
                            </div>

                            <!-- Mobile inline "Add field" CTA -->
                            <div v-if="!isEmpty" class="border-t border-border bg-muted/30 p-3 lg:hidden">
                                <Button class="w-full gap-1.5" @click="showAddSheet = true">
                                    <Plus class="size-4" />
                                    Add another field
                                </Button>
                            </div>
                        </div>

                        <p class="mt-4 hidden text-center text-[10px] text-muted-foreground/70 lg:block">
                            Live mobile preview · 420px wide
                        </p>
                    </div>
                </div>

                <!-- Mobile Settings tab content -->
                <div v-show="mobileTab === 'settings'" class="px-4 pb-24 pt-5 lg:hidden">
                    <div class="mx-auto max-w-[480px] space-y-5">
                        <!-- Validation summary -->
                        <div
                            v-if="!isReadyToSave"
                            class="rounded-xl border border-warning/20 bg-warning/8 p-4 text-xs"
                        >
                            <p class="flex items-center gap-1.5 font-semibold text-warning">
                                <span class="size-1.5 rounded-full bg-current" />
                                {{ validationIssues.length }} required {{ validationIssues.length === 1 ? 'item' : 'items' }} left
                            </p>
                            <ul class="mt-2 space-y-1 pl-4 text-muted-foreground">
                                <li v-for="issue in validationIssues" :key="issue.key" class="list-disc">{{ issue.label }}</li>
                            </ul>
                        </div>

                        <section class="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
                            <h3 class="font-display text-sm font-semibold tracking-[-0.01em] text-foreground">Form details</h3>
                            <div class="space-y-1.5">
                                <Label for="m-title" class="text-xs font-semibold">Title <span class="text-destructive">*</span></Label>
                                <Input id="m-title" v-model="formTitle" placeholder="e.g. Speaker Registration" />
                            </div>
                            <div class="space-y-1.5">
                                <Label for="m-desc" class="text-xs font-semibold">Description <span class="text-destructive">*</span></Label>
                                <Textarea id="m-desc" v-model="formDescription" rows="3" placeholder="Tell registrants what this form is for..." />
                            </div>
                            <div class="space-y-1.5">
                                <Label for="m-closed" class="text-xs font-semibold">Closes at <span class="text-destructive">*</span></Label>
                                <Input id="m-closed" v-model="closedAt" type="datetime-local" />
                            </div>
                            <div class="space-y-2">
                                <Label class="text-xs font-semibold">Visibility <span class="text-destructive">*</span></Label>
                                <div class="flex flex-wrap gap-2">
                                    <button
                                        v-for="opt in visibilityOptions"
                                        :key="opt.value"
                                        type="button"
                                        @click="toggleVisibility(opt.value, !visibleFor.includes(opt.value))"
                                        :class="[
                                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[border-color,background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                            visibleFor.includes(opt.value)
                                                ? 'border-primary/30 bg-primary/10 text-primary'
                                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                                        ]"
                                    >
                                        <Check v-if="visibleFor.includes(opt.value)" class="size-3" />
                                        {{ opt.label }}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section class="rounded-2xl border border-border bg-card p-5 shadow-xs">
                            <h3 class="font-display mb-3 text-sm font-semibold tracking-[-0.01em] text-foreground">Banner</h3>
                            <FormBannerSettings
                                :model-value="bannerState"
                                @update:model-value="(v) => Object.assign(bannerState, v)"
                            />
                        </section>
                    </div>
                </div>
            </main>

            <!-- ─── Desktop inspector (lg+) ─── -->
            <aside class="hidden w-[340px] shrink-0 flex-col border-l border-border bg-card lg:flex" aria-label="Inspector panel">
                <Tabs v-model="inspectorMode" class="flex h-full flex-col">
                    <TabsList class="m-3 grid grid-cols-2">
                        <TabsTrigger value="settings" class="gap-1.5">
                            <SlidersHorizontal class="size-3.5" />
                            Settings
                            <span
                                v-if="!isReadyToSave"
                                class="ml-1 grid size-4 place-items-center rounded-full bg-warning/15 text-[9px] font-bold leading-none text-warning"
                            >
                                !
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="field" class="gap-1.5" :disabled="!selectedField">
                            <Settings class="size-3.5" />
                            Field
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="settings" class="m-0 flex-1 overflow-y-auto">
                        <div class="space-y-5 px-4 pb-6">
                            <div
                                v-if="!isReadyToSave"
                                class="rounded-xl border border-warning/20 bg-warning/8 p-3 text-[11px]"
                            >
                                <p class="flex items-center gap-1.5 font-semibold text-warning">
                                    <span class="size-1.5 rounded-full bg-current" />
                                    {{ validationIssues.length }} required left
                                </p>
                                <ul class="mt-1.5 space-y-0.5 pl-4 text-muted-foreground">
                                    <li v-for="issue in validationIssues" :key="issue.key" class="list-disc">{{ issue.label }}</li>
                                </ul>
                            </div>

                            <div class="space-y-1.5">
                                <Label for="d-title" class="text-xs font-semibold">Title <span class="text-destructive">*</span></Label>
                                <Input id="d-title" v-model="formTitle" placeholder="e.g. Speaker Registration" />
                            </div>
                            <div class="space-y-1.5">
                                <Label for="d-desc" class="text-xs font-semibold">Description <span class="text-destructive">*</span></Label>
                                <Textarea id="d-desc" v-model="formDescription" rows="3" placeholder="Tell registrants what this form is for..." />
                            </div>
                            <div class="space-y-1.5">
                                <Label for="d-closed" class="text-xs font-semibold">Closes at <span class="text-destructive">*</span></Label>
                                <Input id="d-closed" v-model="closedAt" type="datetime-local" />
                            </div>
                            <div class="space-y-2">
                                <Label class="text-xs font-semibold">Visibility <span class="text-destructive">*</span></Label>
                                <div class="flex flex-wrap gap-2">
                                    <button
                                        v-for="opt in visibilityOptions"
                                        :key="opt.value"
                                        type="button"
                                        @click="toggleVisibility(opt.value, !visibleFor.includes(opt.value))"
                                        :class="[
                                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[border-color,background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                            visibleFor.includes(opt.value)
                                                ? 'border-primary/30 bg-primary/10 text-primary'
                                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                                        ]"
                                    >
                                        <Check v-if="visibleFor.includes(opt.value)" class="size-3" />
                                        {{ opt.label }}
                                    </button>
                                </div>
                            </div>
                            <div class="space-y-2 pt-2">
                                <p class="text-xs font-semibold text-foreground">Banner</p>
                                <FormBannerSettings
                                    :model-value="bannerState"
                                    @update:model-value="(v) => Object.assign(bannerState, v)"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="field" class="m-0 flex-1 overflow-y-auto">
                        <div class="px-4 pb-6">
                            <FieldEditor v-if="selectedField" :field="selectedField" @update:field="updateField" />
                            <div v-else class="flex flex-col items-center justify-center py-16 text-center">
                                <div class="grid size-12 place-items-center rounded-2xl border border-dashed border-border bg-muted/30">
                                    <Settings class="size-5 text-muted-foreground" />
                                </div>
                                <p class="mt-4 text-xs font-semibold text-foreground">No field selected</p>
                                <p class="mt-1 max-w-[220px] text-[10px] leading-relaxed text-muted-foreground">
                                    Click any field on the canvas to edit its properties.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </aside>
        </div>

        <!-- ════════════════════════════════════════════════════════
             MOBILE: Floating Add-Field button (Build tab only)
             ════════════════════════════════════════════════════════ -->
        <button
            v-if="mobileTab === 'build' && !isEmpty"
            type="button"
            class="fixed bottom-6 right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:bg-primary/92 active:scale-[0.96] lg:hidden"
            aria-label="Add field"
            @click="showAddSheet = true"
        >
            <Plus class="size-6" />
        </button>
    </div>

    <!-- ════════════════════════════════════════════════════════
         MOBILE: Add-Field bottom sheet
         ════════════════════════════════════════════════════════ -->
    <Sheet v-model:open="showAddSheet">
        <SheetContent side="bottom" class="flex max-h-[88vh] flex-col rounded-t-2xl border-t border-border p-0">
            <SheetHeader class="shrink-0 space-y-1 border-b border-border px-5 py-4 text-left">
                <SheetTitle class="font-display flex items-center gap-2 text-base font-bold tracking-[-0.015em]">
                    <Plus class="size-4 text-primary" />
                    Add a field
                </SheetTitle>
                <SheetDescription class="text-xs">Tap any block to insert it at the bottom of your form.</SheetDescription>
            </SheetHeader>
            <div class="border-b border-border bg-card px-5 py-3">
                <div class="relative">
                    <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search components..."
                        class="w-full rounded-lg border border-border bg-card py-2.5 pr-3 pl-9 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                    />
                </div>
            </div>
            <div class="flex-1 space-y-5 overflow-y-auto bg-background px-5 py-5">
                <section v-for="cat in filteredCategories" :key="cat.name">
                    <div class="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <component :is="cat.icon" class="size-3.5" />
                        {{ cat.name }}
                    </div>
                    <div class="grid grid-cols-2 gap-2.5">
                        <button
                            v-for="f in cat.fields"
                            :key="f.type"
                            type="button"
                            class="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3.5 text-left shadow-xs transition-[transform,border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-primary/30 active:scale-[0.98]"
                            @click="addField(f, false)"
                        >
                            <div class="grid size-9 place-items-center rounded-lg border border-primary/15 bg-primary/8 text-primary transition-colors group-hover:border-primary/30 group-hover:bg-primary/12">
                                <component :is="f.icon" class="size-4" />
                            </div>
                            <div class="min-w-0">
                                <p class="truncate text-[13px] font-semibold text-foreground">{{ f.label }}</p>
                                <p class="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{{ f.description }}</p>
                            </div>
                        </button>
                    </div>
                </section>
                <div v-if="filteredCategories.length === 0" class="flex flex-col items-center py-10 text-center">
                    <Search class="mb-2 size-9 text-muted-foreground/50" />
                    <p class="text-sm font-medium text-muted-foreground">No components match "{{ searchQuery }}"</p>
                </div>
            </div>
        </SheetContent>
    </Sheet>

    <!-- ════════════════════════════════════════════════════════
         MOBILE: Field editor side sheet
         ════════════════════════════════════════════════════════ -->
    <Sheet v-model:open="showMobileEditor">
        <SheetContent side="right" class="flex w-full flex-col p-0 sm:max-w-md lg:hidden">
            <SheetHeader class="shrink-0 border-b border-border bg-muted/30 p-5 text-left">
                <SheetTitle class="font-display tracking-[-0.01em]">Edit field</SheetTitle>
                <SheetDescription>Customize the selected field.</SheetDescription>
            </SheetHeader>
            <div class="flex-1 overflow-y-auto bg-background px-5 py-5">
                <FieldEditor v-if="selectedField" :field="selectedField" @update:field="updateField" />
            </div>
            <div class="shrink-0 border-t border-border bg-muted/30 p-4">
                <Button class="h-11 w-full" @click="showMobileEditor = false">Done</Button>
            </div>
        </SheetContent>
    </Sheet>

    <FormPreviewDialog
        :open="showPreview"
        :title="formTitle || 'Untitled Form'"
        :description="formDescription"
        :form-banner-url="bannerState.bannerUrl"
        :form-banner-caption="bannerState.caption"
        :fields="formFields"
        @close="showPreview = false"
    />

    <Toaster position="top-right" richColors />
</template>
