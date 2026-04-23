<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'
import { toast } from 'vue-sonner'
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue'
import PageHeader from '@/components/modules/dashboard/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Save } from 'lucide-vue-next'

defineOptions({ layout: DashboardFocusLayout })

const props = defineProps<{
    event: { id: string; title: string }
}>()

const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'participant', label: 'Participant' },
    { value: 'admin', label: 'Admin' },
] as const

const form = useForm({
    title: '',
    description: '',
    closed_at: '',
    visible_for: [] as string[],
})

function toggleVisibility(value: string, checked: boolean) {
    const set = new Set(form.visible_for)
    if (checked) set.add(value)
    else set.delete(value)
    form.visible_for = Array.from(set)
}

function submit() {
    form.post(`/dashboard/events/${props.event.id}/forms`, {
        onSuccess: () => toast.success('Form created.'),
    })
}
</script>

<template>
    <Head title="Create Form" />

    <div class="flex flex-col gap-6">
        <PageHeader title="Create Form" :subtitle="`Create a registration form for ${event.title}.`" />

        <Card class="rounded-xl border shadow-xs">
            <CardHeader class="pb-3">
                <CardTitle class="text-sm font-medium">Form details</CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-4 pt-0">
                <div class="flex flex-col gap-1.5">
                    <Label>Title</Label>
                    <Input v-model="form.title" placeholder="e.g. Registration form" />
                    <p v-if="form.errors.title" class="text-destructive text-xs">{{ form.errors.title }}</p>
                </div>
                <div class="flex flex-col gap-1.5">
                    <Label>Description</Label>
                    <Textarea v-model="form.description" placeholder="Brief description" rows="3" />
                    <p v-if="form.errors.description" class="text-destructive text-xs">{{ form.errors.description }}</p>
                </div>
                <div class="flex flex-col gap-1.5">
                    <Label>Closes at</Label>
                    <Input v-model="form.closed_at" type="datetime-local" class="text-xs" />
                    <p v-if="form.errors.closed_at" class="text-destructive text-xs">{{ form.errors.closed_at }}</p>
                </div>
                <div class="flex flex-col gap-2">
                    <Label>Visible for</Label>
                    <div class="flex flex-wrap gap-3">
                        <label
                            v-for="opt in visibilityOptions"
                            :key="opt.value"
                            class="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                :checked="form.visible_for.includes(opt.value)"
                                @update:checked="(v: boolean) => toggleVisibility(opt.value, !!v)"
                            />
                            {{ opt.label }}
                        </label>
                    </div>
                    <p v-if="form.errors.visible_for" class="text-destructive text-xs">{{ form.errors.visible_for }}</p>
                </div>
            </CardContent>
        </Card>

        <Button class="w-full sm:w-auto" :disabled="form.processing" @click="submit">
            <Save class="mr-1.5 size-4" />Create &amp; configure fields
        </Button>
    </div>
</template>
