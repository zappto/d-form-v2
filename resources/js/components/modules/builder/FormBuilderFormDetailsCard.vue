<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const formTitle = defineModel<string>('formTitle', { required: true })
const formDescription = defineModel<string>('formDescription', { required: true })
const closedAt = defineModel<string>('closedAt', { required: true })
const visibleFor = defineModel<string[]>('visibleFor', { required: true })

defineProps<{
    idPrefix: string
    fieldErrors: Partial<Record<'title' | 'description' | 'closed_at' | 'visible_for', string>>
    visibilityOptions: readonly { value: string; label: string }[]
}>()

defineEmits<{
    toggleVisibility: [value: string, checked: boolean]
}>()
</script>

<template>
    <section class="border-border bg-card space-y-5 rounded-2xl border p-6 shadow-xs">
        <h3 class="font-display text-foreground text-base font-semibold tracking-tight">Form details</h3>
        <div class="space-y-2">
            <Label :for="`${idPrefix}-title`" class="text-sm font-medium"
                >Title <span class="text-destructive">*</span></Label
            >
            <Input
                :id="`${idPrefix}-title`"
                v-model="formTitle"
                placeholder="e.g. Speaker Registration"
                class="min-h-12 !py-3.5 px-4 text-sm leading-normal"
            />
            <p v-if="fieldErrors.title" class="text-destructive text-xs">{{ fieldErrors.title }}</p>
        </div>
        <div class="space-y-2">
            <Label :for="`${idPrefix}-desc`" class="text-sm font-medium"
                >Description <span class="text-destructive">*</span></Label
            >
            <Textarea
                :id="`${idPrefix}-desc`"
                v-model="formDescription"
                rows="3"
                placeholder="Tell registrants what this form is for..."
                class="min-h-[6rem] !py-3.5 px-4 text-sm leading-relaxed"
            />
            <p v-if="fieldErrors.description" class="text-destructive text-xs">{{ fieldErrors.description }}</p>
        </div>
        <div class="space-y-2">
            <Label :for="`${idPrefix}-closed`" class="text-sm font-medium"
                >Closes at <span class="text-destructive">*</span></Label
            >
            <Input
                :id="`${idPrefix}-closed`"
                v-model="closedAt"
                type="datetime-local"
                class="min-h-12 !py-3.5 px-4 text-sm leading-normal"
            />
            <p v-if="fieldErrors.closed_at" class="text-destructive text-xs">{{ fieldErrors.closed_at }}</p>
        </div>
        <div class="space-y-3">
            <Label class="text-sm font-medium">Visibility <span class="text-destructive">*</span></Label>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="opt in visibilityOptions"
                    :key="opt.value"
                    type="button"
                    @click="$emit('toggleVisibility', opt.value, !visibleFor.includes(opt.value))"
                    :class="[
                        'rounded-full border px-4 py-2 text-sm font-medium transition-[border-color,background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        visibleFor.includes(opt.value)
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/25 hover:text-foreground',
                    ]"
                >
                    {{ opt.label }}
                </button>
            </div>
            <p v-if="fieldErrors.visible_for" class="text-destructive text-xs">{{ fieldErrors.visible_for }}</p>
        </div>
    </section>
</template>
