<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Head } from '@inertiajs/vue3'
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue'
import DraggableItem from '@/components/modules/builder/DraggableItem.vue'
import FieldRenderer from '@/components/modules/builder/FieldRenderer.vue'
import FieldEditor from '@/components/modules/builder/FieldEditor.vue'
import FormBannerSettings from '@/components/modules/builder/FormBannerSettings.vue'
import { Button } from '@/components/ui/button'
import LocalLottie from '@/components/core/LocalLottie.vue'
import { defaultFormBannerState, normalizeBannerSrc, type FormBannerState } from '@/components/modules/builder/formBanner'
import {
    cloneFormBuilderPalette,
    ALL_FORM_BUILDER_FIELD_TEMPLATES,
    type FormBuilderPaletteCategory,
    type FormBuilderPaletteField,
} from '@/components/modules/builder/formBuilderPalette'
import {
    GripVertical, ChevronRight, Search, Eye, Save,
    Smartphone, Sparkles, Plus,
} from 'lucide-vue-next'

defineOptions({ layout: DashboardFocusLayout })

// ─── Field palette (shared) ───────────────────────────────────────
const categories = ref<FormBuilderPaletteCategory[]>(cloneFormBuilderPalette())

// ─── State ──────────────────────────────────────────────────────
const searchQuery = ref('')

const formTitle = ref('Untitled Form')
const formDescription = ref('Describe what this form is for and what information you need.')
const formFields = ref<IFormField[]>([])
const formBanner = reactive(defaultFormBannerState())
const selectedFieldId = ref<string | null>(null)

// DnD state
const dropIndicatorIndex = ref(-1)
const isDraggingOverCanvas = ref(false)
const dragSourceId = ref<string | null>(null)

// ─── Computed ───────────────────────────────────────────────────
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

const selectedField = computed(() => {
    if (!selectedFieldId.value) return null
    return formFields.value.find((f) => f.id === selectedFieldId.value) ?? null
})

const isEmpty = computed(() => formFields.value.length === 0)
const mobileFieldType = ref('')
const allFieldTypes = ALL_FORM_BUILDER_FIELD_TEMPLATES
const bannerPreviewSrc = computed(() => normalizeBannerSrc(formBanner.bannerUrl))

// ─── Field factory ──────────────────────────────────────────────
function addFieldFromPicker() {
    const picked = allFieldTypes.find((field) => field.type === mobileFieldType.value)
    if (!picked) return
    const nf = createField(picked.type, picked.label)
    formFields.value.push(nf)
    selectedFieldId.value = nf.id
    mobileFieldType.value = ''
}

function createField(type: string, label: string): IFormField {
    const defaults: Record<string, Partial<IFormField>> = {
        short_text: { metadata: { placeholder: '' } },
        long_text: { metadata: { placeholder: '' } },
        email: { metadata: { placeholder: '' } },
        phone: { metadata: { placeholder: '' } },
        number: { metadata: { placeholder: '' } },
        dropdown: { metadata: { options: 'Option 1, Option 2' } },
        checkbox: { metadata: { options: 'Choice A, Choice B, Choice C' } },
        radio: { metadata: { options: 'Option 1, Option 2, Option 3' } },
        image_upload: { metadata: { accepts: 'png, jpg, jpeg' } },
        file_upload: { metadata: { accepts: 'pdf, doc, xls' } },
        rating: { metadata: { maxStars: 5 } },
        heading: { metadata: { content: 'Section Heading' } },
        paragraph: { metadata: { content: '' } },
    }
    return {
        id: crypto.randomUUID(),
        type: type as IFormField['type'],
        label: label || 'Untitled Field',
        name: `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        description: '',
        order: 0,
        metadata: {},
        ...(defaults[type] || {}),
    } as IFormField
}

// ─── Sidebar Drag Start ─────────────────────────────────────────
function onSidebarDragStart(e: DragEvent, fieldData: FormBuilderPaletteField) {
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({ type: fieldData.type, label: fieldData.label, isNew: true }),
        )
    }
}

// ─── Canvas Item Drag Start ─────────────────────────────────────
function onCanvasDragStart(e: DragEvent, field: IFormField, index: number) {
    dragSourceId.value = field.id
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({ id: field.id, fromIndex: index, isNew: false }),
        )
    }
    // slight delay to let browser capture the drag image
    requestAnimationFrame(() => {
        isDraggingOverCanvas.value = true
    })
}

// ─── Drop zone between fields ───────────────────────────────────
function onGapDragEnter(index: number) {
    dropIndicatorIndex.value = index
}

function onCanvasDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = isDraggingOverCanvas.value ? 'move' : 'copy'
    }
    // If dragging over the main canvas container (not a gap), compute closest gap
    if (dropIndicatorIndex.value === -1 && formFields.value.length === 0) {
        dropIndicatorIndex.value = 0
    }
}

function onCanvasDragLeave(e: DragEvent) {
    // Only reset if leaving the entire canvas
    if (e.currentTarget && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        dropIndicatorIndex.value = -1
        isDraggingOverCanvas.value = false
    }
}

function onCanvasDrop(e: DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer?.getData('application/json')
    if (!raw) return

    const data = JSON.parse(raw)
    let insertAt = dropIndicatorIndex.value
    if (insertAt < 0) insertAt = formFields.value.length

    if (data.isNew) {
        // Add new field from sidebar
        const newField = createField(data.type, data.label)
        formFields.value.splice(insertAt, 0, newField)
        selectedFieldId.value = newField.id
    } else {
        // Reorder within canvas
        const fromIndex = formFields.value.findIndex((f) => f.id === data.id)
        if (fromIndex === -1) return
        const [moved] = formFields.value.splice(fromIndex, 1)
        // Adjust insertAt if moving downward
        const adjustedInsert = insertAt > fromIndex ? insertAt - 1 : insertAt
        formFields.value.splice(adjustedInsert, 0, moved)
        selectedFieldId.value = moved.id
    }

    // Reset DnD state
    dropIndicatorIndex.value = -1
    isDraggingOverCanvas.value = false
    dragSourceId.value = null
}

function onDragEnd() {
    dropIndicatorIndex.value = -1
    isDraggingOverCanvas.value = false
    dragSourceId.value = null
}

// ─── Field actions ──────────────────────────────────────────────
function selectField(id: string) {
    selectedFieldId.value = selectedFieldId.value === id ? null : id
}

function deleteField(id: string) {
    formFields.value = formFields.value.filter((f) => f.id !== id)
    if (selectedFieldId.value === id) selectedFieldId.value = null
}

function duplicateField(id: string) {
    const index = formFields.value.findIndex((f) => f.id === id)
    if (index === -1) return
    const original = formFields.value[index]
    const copy: IFormField = {
        ...JSON.parse(JSON.stringify(original)),
        id: crypto.randomUUID(),
        label: `${original.label} (copy)`,
        name: `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
    }
    formFields.value.splice(index + 1, 0, copy)
    selectedFieldId.value = copy.id
}

function updateField(updatedField: IFormField) {
    const index = formFields.value.findIndex((f) => f.id === updatedField.id)
    if (index !== -1) {
        formFields.value[index] = updatedField
    }
}

// ─── Category toggle ────────────────────────────────────────────
function toggleCategory(index: number) {
    categories.value[index].isOpen = !categories.value[index].isOpen
}
</script>

<template>
    <Head title="Form Builder" />

    <div class="flex h-[calc(100svh-3.5rem)] flex-col overflow-hidden lg:flex-row">
        <!-- ════════════════════════════════════════════════════════
             LEFT SIDEBAR — Component Palette
             ════════════════════════════════════════════════════════ -->
        <aside class="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card lg:flex">
            <div class="border-b border-border px-4 pt-4 pb-3">
                <h2 class="font-display flex items-center gap-1.5 text-sm font-semibold tracking-[-0.01em] text-foreground">
                    <Sparkles class="size-4 text-primary" />
                    Components
                </h2>
                <p class="mt-0.5 text-[10px] text-muted-foreground">Drag a component to the form canvas</p>

                <div class="relative mt-3">
                    <Search class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search components..."
                        class="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-8 text-xs font-medium text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                    />
                </div>
            </div>

            <!-- Scrollable categories -->
            <div class="flex-1 overflow-y-auto px-3 py-3">
                <div class="mb-4">
                    <FormBannerSettings
                        :model-value="formBanner"
                        @update:model-value="(value: FormBannerState) => Object.assign(formBanner, value)"
                    />
                </div>
                <div v-for="(category, catIdx) in filteredCategories" :key="category.name" class="mb-3 last:mb-0">
                    <button
                        class="mb-1.5 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                        @click="toggleCategory(catIdx)"
                    >
                        <ChevronRight
                            class="size-3 shrink-0 transition-transform duration-200"
                            :class="category.isOpen ? 'rotate-90' : ''"
                        />
                        <component :is="category.icon" class="size-3.5 shrink-0" />
                        {{ category.name }}
                        <span class="ml-auto text-[10px] font-medium text-muted-foreground">
                            {{ category.fields.length }}
                        </span>
                    </button>

                    <!-- Draggable items -->
                    <div
                        v-show="category.isOpen"
                        class="flex flex-col gap-1.5"
                    >
                        <DraggableItem
                            v-for="f in category.fields"
                            :key="f.type"
                            :type="f.type"
                            :label="f.label"
                            :icon="f.icon"
                            :description="f.description"
                            @dragstart="(e) => onSidebarDragStart(e, f)"
                        />
                    </div>
                </div>

                <!-- No results -->
                <div
                    v-if="filteredCategories.length === 0"
                    class="flex flex-col items-center py-8 text-center"
                >
                    <Search class="mb-2 size-8 text-muted-foreground/50" />
                    <p class="text-xs font-medium text-muted-foreground">No components found</p>
                    <p class="mt-0.5 text-[10px] text-muted-foreground/70">Try a different search term</p>
                </div>
            </div>
        </aside>

        <!-- ════════════════════════════════════════════════════════
             CENTER — Mobile Canvas
             ════════════════════════════════════════════════════════ -->
        <main class="relative flex-1 overflow-y-auto bg-background">
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 px-6 py-2 backdrop-blur-xl">
                <div class="flex items-center gap-2">
                    <Smartphone class="size-4 text-muted-foreground" />
                    <span class="text-xs font-semibold text-muted-foreground">Mobile Preview</span>
                    <span class="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {{ formFields.length }} field{{ formFields.length !== 1 ? 's' : '' }}
                    </span>
                </div>
                <div class="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" class="h-8 text-xs" disabled>
                        <Eye class="mr-1 size-3.5" />Preview
                    </Button>
                    <Button size="sm" class="h-8 text-xs" disabled>
                        <Save class="mr-1 size-3.5" />Save
                    </Button>
                </div>
            </div>
            <div class="border-b border-border bg-muted/30 px-4 py-3 lg:hidden">
                <label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Add field on mobile</label>
                <div class="flex gap-2">
                    <select v-model="mobileFieldType" class="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15">
                        <option value="">Choose field type</option>
                        <option v-for="fieldType in allFieldTypes" :key="fieldType.type" :value="fieldType.type">{{ fieldType.label }}</option>
                    </select>
                    <Button size="sm" class="h-9 shrink-0 text-xs" :disabled="!mobileFieldType" @click="addFieldFromPicker">
                        <Plus class="mr-1 size-3.5" />Add
                    </Button>
                </div>
            </div>

            <!-- Canvas area -->
            <div class="flex justify-center px-6 py-8">
                <div class="w-full max-w-[420px]">
                    <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div
                            v-if="bannerPreviewSrc || formBanner.caption.trim()"
                            class="border-b border-border bg-muted/30"
                        >
                            <img
                                v-if="bannerPreviewSrc"
                                :src="bannerPreviewSrc"
                                alt=""
                                class="aspect-[3/1] w-full object-cover"
                            />
                            <p
                                v-if="formBanner.caption.trim()"
                                class="px-5 py-3 text-[12px] leading-relaxed text-muted-foreground"
                            >
                                {{ formBanner.caption }}
                            </p>
                        </div>
                        <div
                            class="border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-primary/0 px-5 pt-6 pb-5"
                        >
                            <input
                                v-model="formTitle"
                                class="w-full bg-transparent font-display text-xl font-bold tracking-[-0.02em] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                                placeholder="Form Title"
                            />
                            <textarea
                                v-model="formDescription"
                                rows="2"
                                class="mt-2 w-full resize-none bg-transparent text-[13px] leading-relaxed text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                                placeholder="Add a description to help users understand the form..."
                            ></textarea>
                        </div>

                        <!-- Droppable fields area -->
                        <div
                            class="min-h-[400px] px-4 py-4"
                            :class="[
                                isEmpty && !isDraggingOverCanvas
                                    ? 'flex items-center justify-center'
                                    : '',
                                isDraggingOverCanvas && isEmpty ? 'bg-primary/[0.03]' : '',
                            ]"
                            @dragover.prevent="onCanvasDragOver"
                            @dragleave="onCanvasDragLeave"
                            @drop="onCanvasDrop"
                        >
                            <!-- ─── Empty State ─── -->
                            <div
                                v-if="isEmpty && !isDraggingOverCanvas"
                                class="flex flex-col items-center py-6 text-center"
                            >
                                <div class="mb-4 rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-8">
                                    <LocalLottie name="builderEmpty" :height="140" :width="140" />
                                </div>
                                <h3 class="font-display text-base font-bold tracking-[-0.01em] text-foreground">
                                    Start building your form
                                </h3>
                                <p class="mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                                    Drag components from the left panel and drop them here. You can rearrange them anytime.
                                </p>
                                <div class="mt-4 flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5">
                                    <GripVertical class="size-3.5 text-muted-foreground/70" />
                                    <span class="text-[10px] font-medium text-muted-foreground">
                                        Tip: Drag the handle to reorder fields
                                    </span>
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

                            <!-- ─── Field List ─── -->
                            <div v-if="!isEmpty" class="flex flex-col">
                                <template v-for="(field, index) in formFields" :key="field.id">
                                    <!-- Drop indicator BEFORE this field -->
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

                                    <!-- Field card with drag handle -->
                                    <div
                                        class="group relative"
                                        :class="[
                                            dragSourceId === field.id ? 'opacity-30' : '',
                                        ]"
                                    >
                                        <!-- Drag handle (left) -->
                                        <div
                                            class="absolute -left-1 top-1/2 z-10 -translate-x-full -translate-y-1/2 cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
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

                                <!-- Drop indicator AFTER last field -->
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

        <!-- ════════════════════════════════════════════════════════
             RIGHT SIDEBAR — Properties Panel
             ════════════════════════════════════════════════════════ -->
        <aside class="hidden w-[300px] shrink-0 flex-col border-l border-border bg-card lg:flex">
            <div class="border-b border-border px-4 pt-4 pb-3">
                <h2 class="font-display text-sm font-semibold tracking-[-0.01em] text-foreground">Properties</h2>
                <p class="mt-0.5 text-[10px] text-muted-foreground">
                    {{ selectedField ? 'Edit the selected field' : 'Select a field to edit' }}
                </p>
            </div>

            <div class="flex-1 overflow-y-auto px-4 py-4">
                <!-- Field editor -->
                <FieldEditor
                    v-if="selectedField"
                    :field="selectedField"
                    @update:field="updateField"
                />

                <!-- Empty state -->
                <div v-else class="flex h-full flex-col items-center justify-center text-center">
                    <div class="rounded-2xl border border-dashed border-border bg-muted/30 p-6">
                        <LocalLottie name="fieldSelected" :height="100" :width="100" />
                    </div>
                    <p class="mt-4 text-xs font-semibold text-foreground">No field selected</p>
                    <p class="mt-1 max-w-[200px] text-[10px] leading-relaxed text-muted-foreground">
                        Select a field in the form canvas to edit its properties here.
                    </p>
                </div>
            </div>
        </aside>
    </div>
</template>
