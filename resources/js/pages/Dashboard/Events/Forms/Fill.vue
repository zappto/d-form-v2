<script setup lang="ts">
import { computed } from 'vue'
import { Head, useForm, Link } from '@inertiajs/vue3'
import FormFillLayout from '@/layouts/FormFillLayout.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Send, Star, ImagePlus, Upload, X } from 'lucide-vue-next'
import { normalizeBannerSrc, pickFormBannerField } from '@/components/modules/builder/formBanner'
import { readFieldMetadata, readFieldRules } from '@/lib/formFieldMetadata'
import type {
    FormAccessStatus,
    FormFillAnswerMap,
    FormFillOptionRow,
    FormFillPageEvent,
    FormFillPageForm,
    FormFieldMetadataBag,
    FormFieldRules,
} from '@/types/form'

defineOptions({ layout: FormFillLayout })

const props = defineProps<{
    event: FormFillPageEvent
    form: FormFillPageForm
    fields: IFormField[]
    submitUrl: string
    accessStatus: FormAccessStatus
    accessMessage: string
}>()

function metadata(field: IFormField): FormFieldMetadataBag {
    return readFieldMetadata(field)
}

function rules(field: IFormField): FormFieldRules {
    return readFieldRules(field)
}

function builderType(field: IFormField): string {
    const value = metadata(field).builderType
    if (typeof value === 'string') return value
    if (field.name === 'form_banner' || field.type === 'banner') return 'banner'
    return field.type
}

function isDisplayOnly(field: IFormField): boolean {
    const bt = builderType(field)
    return ['heading', 'paragraph', 'divider', 'banner'].includes(bt)
}

const formBannerField = computed(() => pickFormBannerField(props.fields))

const formBannerImageSrc = computed(() => {
    const fb = formBannerField.value
    const meta = fb ? metadata(fb) : {}
    const url = (meta.bannerUrl as string) || props.form.banner_url
    if (!url) return ''
    return normalizeBannerSrc(url)
})

const formBannerCaption = computed(() => {
    const fb = formBannerField.value
    if (fb) {
        const raw = metadata(fb).content
        if (typeof raw === 'string' && raw.trim()) return raw
    }
    return props.form.banner_caption ?? ''
})

const formHasDescription = computed(() => Boolean(props.form.description?.trim()))
const isBlocked = computed(() => props.accessStatus !== 'allowed')

const blockCopy = computed(() => {
    const fallback = props.accessMessage || 'This form is not available right now.'
    const map: Record<FormAccessStatus, { title: string; body: string; success?: boolean }> = {
        allowed: { title: '', body: '' },
        already_submitted: { title: 'You have already submitted this form.', body: fallback, success: true },
        form_closed: { title: 'Registration is closed.', body: fallback },
        registration_not_open: { title: 'Registration is not currently open.', body: fallback },
        quota_full: { title: 'Registration is full.', body: fallback },
        not_visible: { title: 'You do not have access to this form.', body: fallback },
    }
    return map[props.accessStatus]
})

const initialValues: FormFillAnswerMap = {}
for (const field of props.fields) {
    if (isDisplayOnly(field)) continue
    if (field.type === 'checkbox' || (field.type === 'select' && metadata(field).is_multiple)) {
        initialValues[field.name] = []
    } else if (field.type === 'fileUpload') {
        initialValues[field.name] = null
    } else {
        initialValues[field.name] = ''
    }
}

const answerForm = useForm<FormFillAnswerMap>(initialValues)

function listFromCsv(value: unknown): string[] {
    return typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
}

function getOptions(field: IFormField): string[] {
    const direct = metadata(field).options
    if (typeof direct === 'string') return listFromCsv(direct)
    const ruleOptions = (rules(field).in as string | undefined)
    return listFromCsv(ruleOptions)
}

function getOptionRows(field: IFormField): FormFillOptionRow[] {
    const oc = metadata(field).optionChoices
    if (Array.isArray(oc)) {
        const rows: FormFillOptionRow[] = []
        for (const item of oc) {
            if (item && typeof item === 'object' && item !== null) {
                const typedItem = item as { type?: string; label?: string; imageUrl?: string }
                const type = (typedItem.type === 'image' ? 'image' : 'text') as 'text' | 'image'
                const label = String(typedItem.label ?? '').trim()
                const rawUrl = typeof typedItem.imageUrl === 'string' ? String(typedItem.imageUrl).trim() : ''
                
                rows.push({
                    type,
                    label: type === 'text' ? label : (label || 'Image Choice'),
                    imageSrc: rawUrl ? normalizeBannerSrc(rawUrl) : undefined,
                })
            }
        }
        if (rows.length > 0) return rows
    }
    const fallbackOptions = getOptions(field)
    return fallbackOptions.map((label) => ({ type: 'text', label }))
}

function getSelectedOptionRow(field: IFormField) {
    const val = answerForm[field.name] as string
    return getOptionRows(field).find(r => r.label === val)
}

function getInputSubtype(field: IFormField): string {
    const type = metadata(field).type
    if (typeof type === 'string') {
        if (type === 'short_text') return 'text'
        if (type === 'phone') return 'tel'
        return type
    }
    return 'text'
}

function getPlaceholder(field: IFormField): string {
    const placeholder = metadata(field).placeholder
    return typeof placeholder === 'string' ? placeholder : ''
}

function isRequired(field: IFormField): boolean {
    return Boolean(rules(field).required)
}

function isMultipleSelect(field: IFormField): boolean {
    return Boolean(metadata(field).is_multiple)
}

function isRadioLike(field: IFormField): boolean {
    const bt = builderType(field)
    return field.type === 'radio' || bt === 'radio'
}

function isCheckboxLike(field: IFormField): boolean {
    const bt = builderType(field)
    return field.type === 'checkbox' || bt === 'checkbox' || isMultipleSelect(field)
}

function fileHint(field: IFormField): string {
    const parts: string[] = []
    const fieldRules = rules(field)
    if (fieldRules.mimes) parts.push(`Allowed: ${String(fieldRules.mimes)}`)
    if (fieldRules.max_size) parts.push(`Max size: ${String(fieldRules.max_size)} KB`)
    return parts.join(' · ')
}

function acceptValue(field: IFormField): string | undefined {
    const mimes = rules(field).mimes
    if (typeof mimes !== 'string') return undefined
    return mimes.split(',').map((ext) => `.${ext.trim().replace(/^\./, '')}`).join(',')
}

function onCheckboxToggle(fieldName: string, option: string, checked: boolean) {
    const current = Array.isArray(answerForm[fieldName]) ? answerForm[fieldName] as string[] : []
    answerForm[fieldName] = checked ? [...current, option] : current.filter((value) => value !== option)
}

function onFileChange(fieldName: string, event: Event) {
    const input = event.target as HTMLInputElement
    answerForm[fieldName] = input.files?.[0] ?? null
}

function submit() {
    if (isBlocked.value) return
    answerForm.post(props.submitUrl, {
        forceFormData: true,
    })
}

function fieldError(name: string): string | undefined {
    return (answerForm.errors as Record<string, string>)[name]
}
</script>

<template>
    <Head :title="`Register: ${props.form.title}`" />

    <div class="mx-auto max-w-2xl px-2">
        <div
            v-if="formBannerImageSrc || formBannerCaption"
            class="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
            <img
                v-if="formBannerImageSrc"
                :src="formBannerImageSrc"
                :alt="props.form.title"
                class="aspect-[3/1] w-full object-cover"
            />
            <p
                v-if="formBannerCaption"
                class="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground"
            >
                {{ formBannerCaption }}
            </p>
        </div>

        <div class="mb-10 text-center">
            <h1 class="font-display text-balance text-4xl font-bold tracking-[-0.035em] text-foreground">{{ props.form.title }}</h1>
            <p v-if="formHasDescription" class="mt-3 text-sm leading-relaxed text-muted-foreground">{{ props.form.description }}</p>
        </div>

        <Card v-if="isBlocked" class="mt-6">
            <CardContent class="flex flex-col items-center gap-3 py-12 text-center">
                <CheckCircle2 v-if="blockCopy.success" class="size-10 text-success" />
                <AlertCircle v-else class="size-10 text-warning" />
                <p class="font-display text-xl font-bold tracking-[-0.02em] text-foreground">{{ blockCopy.title }}</p>
                <p class="max-w-md text-sm text-muted-foreground">{{ blockCopy.body }}</p>
                <Button variant="outline" size="lg" class="mt-6" as-child>
                    <Link :href="`/dashboard/events/${event.id}`">View event</Link>
                </Button>
            </CardContent>
        </Card>

        <form
            v-else
            class="flex flex-col gap-6"
            @submit.prevent="submit"
        >
            <template v-for="field in fields" :key="field.id">
                <div v-if="builderType(field) === 'heading'" class="rounded-2xl border border-border bg-primary/8 px-5 py-4 shadow-xs">
                    <h2 class="font-display text-2xl font-bold tracking-[-0.025em] text-foreground">
                        {{ metadata(field).content || field.label }}
                    </h2>
                    <p v-if="field.description" class="mt-1.5 text-sm leading-relaxed text-muted-foreground">{{ field.description }}</p>
                </div>

                <div v-else-if="builderType(field) === 'paragraph'" class="rounded-2xl border border-border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground shadow-xs">
                    {{ metadata(field).content || field.description || field.label }}
                </div>

                <hr v-else-if="builderType(field) === 'divider'" class="app-divider my-2" />

                <div v-else-if="builderType(field) === 'banner'" class="hidden" />

                <Card v-else class="overflow-hidden">
                    <CardHeader class="pb-2 pt-4">
                        <CardTitle class="flex items-start gap-1 text-sm font-semibold tracking-[-0.005em] text-foreground">
                            {{ field.label }}
                            <span v-if="isRequired(field)" class="text-destructive">*</span>
                        </CardTitle>
                        <p v-if="field.description" class="text-xs leading-relaxed text-muted-foreground">{{ field.description }}</p>
                    </CardHeader>
                    <CardContent class="pb-4 pt-0">
                        <Input
                            v-if="['short_text', 'email', 'phone', 'number', 'time', 'input'].includes(builderType(field)) && !isMultipleSelect(field)"
                            :id="field.name"
                            :type="getInputSubtype(field)"
                            :placeholder="getPlaceholder(field)"
                            v-model="answerForm[field.name]"
                        />

                        <div v-else-if="builderType(field) === 'rating'" class="flex flex-col gap-3">
                            <div class="flex gap-1.5">
                                <button
                                    v-for="rating in Number(metadata(field).maxStars ?? 5)"
                                    :key="rating"
                                    type="button"
                                    class="rounded-lg p-1 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90"
                                    @click="answerForm[field.name] = String(rating)"
                                >
                                    <Star class="size-7 transition-colors" :class="Number(answerForm[field.name] || 0) >= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'" />
                                </button>
                            </div>
                            <p class="text-xs text-muted-foreground">Choose one rating.</p>
                        </div>

                        <Textarea
                            v-else-if="builderType(field) === 'long_text' || field.type === 'textarea'"
                            :id="field.name"
                            :placeholder="getPlaceholder(field)"
                            v-model="answerForm[field.name]"
                            rows="4"
                        />

                        <Input
                            v-else-if="builderType(field) === 'date' || field.type === 'datePicker'"
                            :id="field.name"
                            type="date"
                            v-model="answerForm[field.name]"
                        />

                        <div v-else-if="isCheckboxLike(field)" class="flex flex-col gap-2">
                            <label
                                v-for="row in getOptionRows(field)"
                                :key="row.label"
                                class="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/30 hover:bg-muted/40"
                            >
                                <Checkbox
                                    :id="`${field.name}-${row.label}`"
                                    :checked="((answerForm[field.name] as string[]) ?? []).includes(row.label)"
                                    @update:checked="(value) => onCheckboxToggle(field.name, row.label, Boolean(value))"
                                />
                                <div v-if="row.type === 'image' && row.imageSrc" class="size-16 shrink-0 overflow-hidden rounded-md border border-border">
                                    <img :src="row.imageSrc" alt="" class="size-full object-cover" />
                                </div>
                                <span v-else>{{ row.label }}</span>
                            </label>
                        </div>

                        <div v-else-if="isRadioLike(field)" class="flex flex-col gap-2">
                            <label
                                v-for="row in getOptionRows(field)"
                                :key="row.label"
                                class="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/30 hover:bg-muted/40"
                            >
                                <input
                                    type="radio"
                                    :name="field.name"
                                    :value="row.label"
                                    :checked="(answerForm[field.name] as string) === row.label"
                                    class="size-4 accent-primary"
                                    @change="() => (answerForm[field.name] = row.label)"
                                />
                                <div v-if="row.type === 'image' && row.imageSrc" class="size-16 shrink-0 overflow-hidden rounded-md border border-border">
                                    <img :src="row.imageSrc" alt="" class="size-full object-cover" />
                                </div>
                                <span v-else>{{ row.label }}</span>
                            </label>
                        </div>

                        <Select
                            v-else-if="builderType(field) === 'dropdown' || field.type === 'select'"
                            v-model="answerForm[field.name]"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an option">
                                    <template v-if="answerForm[field.name]">
                                        <span class="flex items-center gap-2">
                                            <img
                                                v-if="getSelectedOptionRow(field)?.imageSrc"
                                                :src="getSelectedOptionRow(field)?.imageSrc"
                                                alt=""
                                                class="size-6 rounded border border-border object-cover"
                                            />
                                            {{ answerForm[field.name] }}
                                        </span>
                                    </template>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="row in getOptionRows(field)" :key="row.label" :value="row.label">
                                    <span class="flex items-center gap-2">
                                        <img
                                            v-if="row.imageSrc"
                                            :src="row.imageSrc"
                                            alt=""
                                            class="size-7 rounded border border-border object-cover"
                                        />
                                        {{ row.label }}
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <div v-else-if="['file_upload', 'image_upload', 'fileUpload'].includes(builderType(field))" class="relative rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-primary/30 hover:bg-muted/30">
                            <div class="flex flex-col items-center gap-2">
                                <div class="grid size-12 place-items-center rounded-full border border-border bg-card shadow-xs">
                                    <component :is="builderType(field) === 'image_upload' ? ImagePlus : Upload" class="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-foreground">Click to upload</p>
                                    <p class="mt-0.5 text-[10px] text-muted-foreground">{{ fileHint(field) }}</p>
                                </div>
                                <input
                                    type="file"
                                    :accept="acceptValue(field)"
                                    class="absolute inset-0 cursor-pointer opacity-0"
                                    @change="onFileChange(field.name, $event)"
                                />
                            </div>
                            <div v-if="answerForm[field.name]" class="relative z-10 mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
                                <span class="max-w-[200px] truncate text-xs font-medium text-foreground">{{ (answerForm[field.name] as File).name }}</span>
                                <button type="button" @click="answerForm[field.name] = null" class="text-destructive transition-transform hover:scale-110">
                                    <X class="size-4" />
                                </button>
                            </div>
                        </div>

                        <p v-if="fieldError(field.name)" class="mt-2 text-xs font-medium text-destructive">{{ fieldError(field.name) }}</p>
                    </CardContent>
                </Card>
            </template>

            <div class="mb-20 flex items-center justify-end gap-3 border-t border-border pt-6">
                <Button variant="ghost" size="lg" as-child>
                    <Link :href="`/dashboard/events/${event.id}`">Cancel</Link>
                </Button>
                <Button type="submit" size="lg" :disabled="answerForm.processing" class="gap-2">
                    <Send class="size-4" />
                    Submit registration
                </Button>
            </div>
        </form>
    </div>
</template>
