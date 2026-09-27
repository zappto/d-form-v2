<script setup lang="ts">
import { onMounted } from 'vue';
import { Head, useForm } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker, SplitDateTimeField } from '@/components/ui/date-picker';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { fieldInvalidClass } from '@/lib/fieldInvalidClass';
import { useErrorToast } from '@/hooks/useErrorToast';
import { setTopbar } from '@/hooks/useDashboardTopbar';
import { BannerPickerField } from '@/components/core/field';
import { SAVING_LABEL } from '@/lib/uiLabels';

const { handleInertiaFormErrors } = useErrorToast();

defineOptions({ layout: DashboardLayout });

interface IPeriodFormData {
    name: string;
    description: string;
    registration_opens_at: string;
    registration_closes_at: string;
    interview_starts_at: string;
    interview_ends_at: string;
    finalization_deadline_at: string;
    banner: File | null;
}

const form = useForm<IPeriodFormData>({
    name: '',
    description: '',
    registration_opens_at: '',
    registration_closes_at: '',
    interview_starts_at: '',
    interview_ends_at: '',
    finalization_deadline_at: '',
    banner: null,
});

onMounted(() => {
    setTopbar({ title: 'Periode baru', subtitle: 'Open Recruitment' });
});

function submit(): void {
    if (form.processing) return;
    // Tanpa toast sukses manual: RecruitmentPeriodController::store memakai
    // Inertia::flash('toast') yang sudah ditampilkan global oleh usePageFlashToast.
    form.post(routes.admin.recruitment.periods.store, {
        forceFormData: true,
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal membuat periode' });
        },
    });
}
</script>

<template>
    <Head title="Periode baru" />

    <div class="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 pt-0 pb-8 sm:gap-8 sm:pb-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="min-w-0">
                <h1 class="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Periode baru
                </h1>
                <p class="mt-1.5 text-base text-muted-foreground">Open Recruitment</p>
            </div>
            <Button
                type="submit"
                form="period-form"
                :disabled="form.processing"
                :aria-busy="form.processing"
                class="w-full shrink-0 sm:w-auto"
            >
                <CometSpinner v-if="form.processing" :size="16" />
                {{ form.processing ? SAVING_LABEL : 'Simpan' }}
            </Button>
        </div>

        <Card class="rounded-2xl border-border/70">
            <CardContent class="p-6">
                <form id="period-form" class="space-y-4" @submit.prevent="submit">
                    <div class="space-y-2">
                        <Label for="name">Nama periode</Label>
                        <Input id="name" v-model="form.name" placeholder="Open Recruitment 2026" required />
                        <p v-if="form.errors.name" class="text-xs text-destructive">{{ form.errors.name }}</p>
                    </div>

                    <div class="space-y-2">
                        <Label for="description">Deskripsi</Label>
                        <textarea
                            id="description"
                            v-model="form.description"
                            rows="3"
                            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <div class="space-y-2">
                        <div>
                            <Label for="banner">Banner</Label>
                            <p class="mt-1 text-xs text-muted-foreground">Opsional — disarankan 16:9, maks 5 MB</p>
                        </div>

                        <BannerPickerField
                            variant="plain"
                            v-model:file="form.banner"
                            :invalid="!!form.errors.banner"
                            :error="form.errors.banner"
                        />
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <SplitDateTimeField
                            id-prefix="reg_open"
                            v-model="form.registration_opens_at"
                            label="Buka pendaftaran"
                            picker-class="bg-white"
                            class="sm:col-span-2"
                            :error="form.errors.registration_opens_at"
                            :invalid="!!form.errors.registration_opens_at"
                        />
                        <SplitDateTimeField
                            id-prefix="reg_close"
                            v-model="form.registration_closes_at"
                            label="Tutup pendaftaran"
                            picker-class="bg-white"
                            class="sm:col-span-2"
                            :error="form.errors.registration_closes_at"
                            :invalid="!!form.errors.registration_closes_at"
                        />

                        <div class="space-y-2">
                            <Label for="interview_starts_at">Mulai interview</Label>
                            <DatePicker
                                id="interview_starts_at"
                                v-model="form.interview_starts_at"
                                :aria-invalid="!!form.errors.interview_starts_at"
                                :class="cn('bg-white', fieldInvalidClass(!!form.errors.interview_starts_at))"
                            />
                            <p v-if="form.errors.interview_starts_at" class="text-xs text-destructive">
                                {{ form.errors.interview_starts_at }}
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label for="interview_ends_at">Akhir interview</Label>
                            <DatePicker
                                id="interview_ends_at"
                                v-model="form.interview_ends_at"
                                :aria-invalid="!!form.errors.interview_ends_at"
                                :class="cn('bg-white', fieldInvalidClass(!!form.errors.interview_ends_at))"
                            />
                            <p v-if="form.errors.interview_ends_at" class="text-xs text-destructive">
                                {{ form.errors.interview_ends_at }}
                            </p>
                        </div>

                        <div class="space-y-2 sm:col-span-2">
                            <Label for="finalization_deadline_at">Target finalisasi</Label>
                            <DatePicker
                                id="finalization_deadline_at"
                                v-model="form.finalization_deadline_at"
                                :aria-invalid="!!form.errors.finalization_deadline_at"
                                :class="cn('bg-white', fieldInvalidClass(!!form.errors.finalization_deadline_at))"
                            />
                            <p v-if="form.errors.finalization_deadline_at" class="text-xs text-destructive">
                                {{ form.errors.finalization_deadline_at }}
                            </p>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
</template>
