<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Head, useForm } from '@inertiajs/vue3';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import { Skeleton } from '@/components/ui/skeleton';
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

const { handleInertiaFormErrors, showFlashToast } = useErrorToast();

defineOptions({ layout: DashboardLayout });

interface IPeriod {
    id: string;
    name: string;
    description: string | null;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    interview_starts_at: string | null;
    interview_ends_at: string | null;
    finalization_deadline_at: string | null;
    banner_url: string | null;
}

const props = defineProps<{ period: IPeriod | undefined }>();

function toDatetimeLocal(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(value: string | null): string {
    if (!value) return '';
    return value.slice(0, 10);
}

const existingBannerUrl = computed<string | null>(() => props.period?.banner_url ?? null);

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
    name: props.period?.name ?? '',
    description: props.period?.description ?? '',
    registration_opens_at: toDatetimeLocal(props.period?.registration_opens_at ?? null),
    registration_closes_at: toDatetimeLocal(props.period?.registration_closes_at ?? null),
    interview_starts_at: toDateInput(props.period?.interview_starts_at ?? null),
    interview_ends_at: toDateInput(props.period?.interview_ends_at ?? null),
    finalization_deadline_at: toDateInput(props.period?.finalization_deadline_at ?? null),
    banner: null,
});

onMounted(() => {
    setTopbar({ title: 'Edit periode', subtitle: props.period?.name ?? '' });
});

function submit(): void {
    if (form.processing) return;
    const currentPeriod = props.period;
    if (!currentPeriod) return;
    form.put(routes.admin.recruitment.periods.update(currentPeriod.id), {
        forceFormData: true,
        onSuccess: () => {
            // Manual: RecruitmentPeriodController::update memakai ->with('message')
            // yang tidak dibaca usePageFlashToast (hanya page.flash.toast).
            showFlashToast({ type: 'success', message: 'Periode recruitment berhasil diperbarui.' });
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal memperbarui periode' });
        },
    });
}
</script>

<template>
    <Head title="Edit periode Open Recruitment" />

    <div class="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 pt-0 pb-8 sm:gap-8 sm:pb-10">
        <div v-if="!period" aria-busy="true" aria-label="Memuat formulir periode">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="min-w-0 space-y-1.5">
                    <Skeleton class="h-8 w-48" />
                    <Skeleton class="h-4 w-64 max-w-full" />
                </div>
                <Skeleton class="edit-save-skeleton h-10 w-full shrink-0 sm:w-40" />
            </div>

            <div class="mt-6 rounded-2xl border border-border/70 bg-card p-6">
                <div class="space-y-4">
                    <div class="edit-field-skeleton space-y-2">
                        <Skeleton class="h-4 w-28" />
                        <Skeleton class="h-10 w-full rounded-md" />
                    </div>
                    <div class="edit-field-skeleton space-y-2">
                        <Skeleton class="h-4 w-24" />
                        <Skeleton class="h-20 w-full rounded-md" />
                    </div>
                    <div class="edit-field-skeleton space-y-2">
                        <Skeleton class="h-4 w-20" />
                        <Skeleton class="aspect-video w-full rounded-xl" />
                    </div>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-36" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-36" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-32" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-32" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-36" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template v-else>
            <div class="fade-up flex flex-wrap items-center justify-between gap-4">
                <div class="min-w-0">
                    <h1 class="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        Edit periode
                    </h1>
                    <p class="mt-1.5 text-base text-muted-foreground">{{ period.name }}</p>
                </div>
                <Button
                    type="submit"
                    form="period-form"
                    :disabled="form.processing"
                    :aria-busy="form.processing"
                    class="w-full shrink-0 sm:w-auto"
                >
                    <CometSpinner v-if="form.processing" :size="16" />
                    {{ form.processing ? 'Menyimpan...' : 'Simpan perubahan' }}
                </Button>
            </div>

            <Card class="fade-up rounded-2xl border-border/70">
                <CardContent class="p-6">
                    <form id="period-form" class="space-y-4" @submit.prevent="submit">
                        <div class="space-y-2">
                            <Label for="name">Nama periode</Label>
                            <Input id="name" v-model="form.name" required />
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
                                <p class="mt-1 text-xs text-muted-foreground">
                                    Opsional — disarankan 16:9, maks 5 MB. Pilih berkas baru untuk menggantikan banner
                                    saat ini.
                                </p>
                            </div>

                            <BannerPickerField
                                variant="plain"
                                v-model:file="form.banner"
                                :initial-url="existingBannerUrl"
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
        </template>
    </div>
</template>
