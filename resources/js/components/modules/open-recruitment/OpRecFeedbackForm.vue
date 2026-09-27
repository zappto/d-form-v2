<script setup lang="ts">
import { computed } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { buildValuesDraftSnapshot, useDraftRestore, type IDraftValuesSnapshot } from '@/hooks/useDraftRestore';
import type { TFormFillAnswerMap } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CometSpinner } from '@/components/ui/comet';
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message';
import { readFormError } from '@/lib/formErrors';

const props = defineProps<{
    storeUrl: string;
    compact?: boolean;
}>();

const emit = defineEmits<{
    success: [];
    cancel: [];
}>();

const ratingFields = [
    { key: 'rating_registration_ease', label: 'Kemudahan pendaftaran' },
    { key: 'rating_info_clarity', label: 'Kejelasan informasi OpRec' },
    { key: 'rating_tracking_ease', label: 'Kemudahan portal tracking' },
    { key: 'rating_interview_experience', label: 'Pengalaman interview' },
    { key: 'rating_staff_service', label: 'Pelayanan panitia' },
] as const;

const form = useForm({
    rating_registration_ease: '',
    rating_info_clarity: '',
    rating_tracking_ease: '',
    rating_interview_experience: '',
    rating_staff_service: '',
    feedback_text: '',
});

const feedbackError = computed(() => readFormError(form.errors, 'feedback'));

/** Batas luar snapshot localStorage: verifikasi bentuk `{ values }` sebelum dipakai. */
function isValuesSnapshot(value: unknown): value is IDraftValuesSnapshot {
    if (typeof value !== 'object' || value === null || !('values' in value)) return false;
    const values: unknown = value.values;
    return typeof values === 'object' && values !== null;
}

/** Form Inertia dinamis diperlakukan sebagai peta jawaban; verifikasi bentuk object saat menulis. */
function isFormFillAnswerMap(value: unknown): value is TFormFillAnswerMap {
    return typeof value === 'object' && value !== null;
}

/** Restorasi toleran: snapshot rusak/parsial diabaikan; hanya isian teks yang dituang ke form. */
function applyFeedbackDraftValues(draft: IDraftValuesSnapshot): void {
    if (!isValuesSnapshot(draft) || !isFormFillAnswerMap(form)) return;
    for (const [key, value] of Object.entries(draft.values)) {
        if (!(key in form)) continue;
        if (typeof value === 'string') form[key] = value;
    }
}

const { clear: clearFeedbackDraft } = useDraftRestore({
    snapshot: () => buildValuesDraftSnapshot(form),
    storageKey: 'dform:track-feedback',
    restoreIntoForm: applyFeedbackDraftValues,
});

function submit(): void {
    if (form.processing) return;
    form.post(props.storeUrl, {
        preserveScroll: true,
        onSuccess: () => {
            clearFeedbackDraft();
            form.reset();
            showFlashToast({ type: 'success', message: 'Terima kasih! Feedback kamu telah kami terima.' });
            emit('success');
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal mengirim feedback' });
        },
    });
}
</script>

<template>
    <form class="space-y-4" @submit.prevent="submit">
        <div
            v-for="field in ratingFields"
            :key="field.key"
            class="space-y-1.5"
            :class="compact ? 'sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3 sm:space-y-0' : 'space-y-2'"
        >
            <Label :for="field.key" class="text-sm">{{ field.label }}</Label>
            <select
                :id="field.key"
                v-model="form[field.key]"
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-[120px]"
                required
            >
                <option value="" disabled>1–5</option>
                <option v-for="n in 5" :key="n" :value="String(n)">{{ n }}</option>
            </select>
            <p v-if="form.errors[field.key]" class="text-xs text-destructive sm:col-span-2">
                {{ form.errors[field.key] }}
            </p>
        </div>

        <div class="space-y-2">
            <Label for="feedback_text">Saran (opsional)</Label>
            <textarea
                id="feedback_text"
                v-model="form.feedback_text"
                rows="3"
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ceritakan pengalamanmu..."
            />
        </div>

        <p v-if="feedbackError" class="text-sm text-destructive">{{ feedbackError }}</p>

        <div class="flex flex-wrap gap-2 pt-1">
            <Button type="submit" size="sm" :disabled="form.processing" :aria-busy="form.processing">
                <CometSpinner v-if="form.processing" :size="16" />
                {{ form.processing ? 'Mengirim...' : 'Kirim feedback' }}
            </Button>
            <Button
                v-if="$attrs.onCancel !== undefined"
                type="button"
                variant="ghost"
                size="sm"
                @click="emit('cancel')"
            >
                Batal
            </Button>
        </div>
    </form>
</template>
