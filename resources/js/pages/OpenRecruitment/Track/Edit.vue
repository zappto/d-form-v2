<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link, useForm } from '@inertiajs/vue3';
import { buildValuesDraftSnapshot, useDraftRestore } from '@/hooks/useDraftRestore';
import FormFillLayout from '@/layouts/FormFillLayout.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { routes } from '@/lib/routes';
import { handleInertiaFormErrors, showFlashToast } from '@/lib/error-message';

defineOptions({ layout: FormFillLayout });

interface DivisionOption {
    id: string;
    name: string;
}

interface ApplicationFormData {
    full_name: string;
    nim: string;
    semester: number;
    phone: string;
    personal_email: string;
    student_email: string;
    instagram_username: string;
    primary_division_id: string;
    secondary_division_id: string | null;
    portfolio_type: string;
    portfolio_url: string | null;
    cv_original_name: string | null;
    portfolio_original_name: string | null;
    instagram_follow_original_name: string | null;
    twibbon_url: string | null;
}

const props = defineProps<{
    application: ApplicationFormData | undefined;
    divisions: DivisionOption[] | undefined;
    updateUrl: string;
    dashboardUrl: string;
}>();

const form = useForm({
    full_name: props.application?.full_name ?? '',
    nim: props.application?.nim ?? '',
    semester: String(props.application?.semester ?? ''),
    phone: props.application?.phone ?? '',
    personal_email: props.application?.personal_email ?? '',
    student_email: props.application?.student_email ?? '',
    instagram_username: props.application?.instagram_username ?? '',
    primary_division_id: props.application?.primary_division_id ?? '',
    secondary_division_id: props.application?.secondary_division_id ?? '',
    portfolio_type: (props.application?.portfolio_type as 'url' | 'file' | 'none') || 'none',
    portfolio_url: props.application?.portfolio_url ?? '',
    portfolio_file: null as File | null,
    cv: null as File | null,
    instagram_follow_proof: null as File | null,
    twibbon_url: props.application?.twibbon_url ?? '',
});

function applyTrackEditDraftValues(draft: unknown): void {
    if (typeof draft !== 'object' || draft === null) return;
    const values = (draft as { values?: unknown }).values;
    if (typeof values !== 'object' || values === null) return;
    for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
        if (!(key in form)) continue;
        if (typeof value === 'string') {
            (form as unknown as Record<string, unknown>)[key] = value;
        }
    }
}

const { clear: clearTrackEditDraft } = useDraftRestore({
    snapshot: () => buildValuesDraftSnapshot(form),
    storageKey: 'dform:track-edit',
    restoreIntoForm: applyTrackEditDraftValues,
});

const semesterOptions: SearchableSelectOption[] = [
    { value: '1', label: 'Semester 1' },
    { value: '3', label: 'Semester 3' },
];

const divisionOptions = computed<SearchableSelectOption[]>(() =>
    (props.divisions ?? []).map((division: DivisionOption): SearchableSelectOption => ({
        value: division.id,
        label: division.name,
    }))
);

const secondaryDivisionOptions = computed<SearchableSelectOption[]>(() => [
    { value: '', label: 'Tidak ada' },
    ...divisionOptions.value,
]);

const cvHint = computed(() =>
    props.application?.cv_original_name
        ? `File saat ini: ${props.application.cv_original_name} (kosongkan jika tidak diganti)`
        : 'Unggah CV PDF'
);

const instagramFollowHint = computed(() =>
    props.application?.instagram_follow_original_name
        ? `File saat ini: ${props.application.instagram_follow_original_name} (kosongkan jika tidak diganti)`
        : 'Unggah screenshot follow Instagram (jpg/jpeg/png/webp)'
);

function onCvChange(event: Event) {
    const target = event.target as HTMLInputElement;
    form.cv = target.files?.[0] ?? null;
}

function onPortfolioFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    form.portfolio_file = target.files?.[0] ?? null;
}

function onInstagramFollowChange(event: Event) {
    const target = event.target as HTMLInputElement;
    form.instagram_follow_proof = target.files?.[0] ?? null;
}

function submit(): void {
    if (form.processing) return
    form.clearErrors('semester', 'primary_division_id', 'secondary_division_id');
    let firstEmpty: string | null = null;
    if (form.semester === '') {
        form.setError('semester', 'Semester wajib dipilih.');
        firstEmpty = 'semester';
    }
    if (form.primary_division_id === '') {
        form.setError('primary_division_id', 'Divisi utama wajib dipilih.');
        if (firstEmpty === null) firstEmpty = 'primary_division_id';
    }
    if (firstEmpty !== null) {
        document.getElementById(firstEmpty)?.focus();
        return;
    }
    form.put(props.updateUrl, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
            clearTrackEditDraft();
            // Manual: TrackingController::update memakai ->with('toast') sesi biasa
            // yang tidak dibaca usePageFlashToast (hanya page.flash.toast).
            showFlashToast({ type: 'success', message: 'Perubahan pendaftaran berhasil disimpan.' });
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal menyimpan perubahan' });
        },
    });
}

const portfolioUrlRadio = ref<HTMLButtonElement | null>(null);
const portfolioFileRadio = ref<HTMLButtonElement | null>(null);
const portfolioNoneRadio = ref<HTMLButtonElement | null>(null);

type PortfolioType = 'none' | 'url' | 'file';

function focusPortfolioRadio(value: PortfolioType): void {
    const target =
        value === 'url'
            ? portfolioUrlRadio.value
            : value === 'file'
              ? portfolioFileRadio.value
              : portfolioNoneRadio.value;
    target?.focus();
}

function onPortfolioTypeKeydown(event: KeyboardEvent): void {
    const order: PortfolioType[] = ['none', 'url', 'file'];
    const current = order.indexOf(form.portfolio_type as PortfolioType);
    let next: number | null = null;
    switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            next = (current + 1) % order.length;
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            next = (current - 1 + order.length) % order.length;
            break;
        case 'Home':
            next = 0;
            break;
        case 'End':
            next = order.length - 1;
            break;
        default:
            return;
    }
    event.preventDefault();
    const value = order[next] ?? 'none';
    if (value !== form.portfolio_type) form.portfolio_type = value;
    focusPortfolioRadio(value);
}
</script>

<template>
    <Head title="Edit Pendaftaran OpRec" />

    <div class="mx-auto max-w-2xl px-2 pb-8">
        <div v-if="!application" aria-busy="true" aria-label="Memuat formulir pendaftaran">
            <div class="mb-6 space-y-3">
                <div class="flex flex-col items-center gap-1">
                    <Skeleton class="h-6 w-56" />
                    <Skeleton class="h-4 w-72 max-w-full" />
                </div>
            </div>

            <div class="space-y-4">
                <div class="rounded-2xl border border-border/70 bg-card">
                    <div class="px-4 pt-4 sm:px-6">
                        <Skeleton class="h-5 w-32" />
                        <Skeleton class="mt-1.5 h-4 w-64 max-w-full" />
                    </div>
                    <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                        <div class="track-edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-28" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-20" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-20" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-24" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-28" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-28" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-border/70 bg-card">
                    <div class="px-4 pt-4 sm:px-6">
                        <Skeleton class="h-5 w-40" />
                        <Skeleton class="mt-1.5 h-4 w-56 max-w-full" />
                    </div>
                    <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-24" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-28" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2 sm:col-span-2">
                            <Skeleton class="h-4 w-32" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-border/70 bg-card">
                    <div class="px-4 pt-4 sm:px-6">
                        <Skeleton class="h-5 w-24" />
                        <Skeleton class="mt-1.5 h-4 w-72 max-w-full" />
                    </div>
                    <div class="space-y-5 p-4 sm:p-6">
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-20" />
                            <Skeleton class="h-10 w-full rounded-md" />
                            <Skeleton class="h-3 w-2/3" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-3">
                            <Skeleton class="h-4 w-36" />
                            <Skeleton class="h-11 w-full rounded-lg" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-44" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                        <div class="track-edit-field-skeleton space-y-2">
                            <Skeleton class="h-4 w-32" />
                            <Skeleton class="h-10 w-full rounded-md" />
                        </div>
                    </div>
                </div>

                <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <Skeleton class="h-10 w-full sm:w-44" />
                    <Skeleton class="h-10 w-full sm:w-28" />
                </div>
            </div>
        </div>
        <template v-else>
        <div class="mb-6 space-y-3">
            <div class="flex flex-col items-center gap-1">
                <h1 class="text-xl font-bold tracking-tight">Perbarui pendaftaran</h1>
                <p class="text-muted-foreground text-sm">Perbaiki data sesuai instruksi tim.</p>
            </div>
        </div>

        <form class="fade-up space-y-4" @submit.prevent="submit">
            <p v-if="form.errors.application" class="text-destructive text-sm">
                {{ form.errors.application }}
            </p>

            <!-- Data diri -->
            <Card class="border-border/70 rounded-2xl">
                <CardHeader class="pb-4">
                    <CardTitle class="text-base">Data diri</CardTitle>
                    <p class="text-muted-foreground text-sm">Nama, kontak, dan email yang bisa dihubungi.</p>
                </CardHeader>
                <CardContent class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-2 sm:col-span-2">
                        <Label for="full_name">Nama lengkap</Label>
                        <Input id="full_name" v-model="form.full_name" required />
                        <p v-if="form.errors.full_name" class="text-destructive text-xs">{{ form.errors.full_name }}</p>
                    </div>

                    <div class="space-y-2">
                        <Label for="nim">NIM</Label>
                        <Input id="nim" v-model="form.nim" required />
                        <p v-if="form.errors.nim" class="text-destructive text-xs">{{ form.errors.nim }}</p>
                    </div>

                    <div class="space-y-2">
                        <Label for="phone">Telepon</Label>
                        <Input id="phone" v-model="form.phone" required />
                        <p v-if="form.errors.phone" class="text-destructive text-xs">{{ form.errors.phone }}</p>
                    </div>

                    <div class="space-y-2 sm:col-span-2">
                        <Label for="instagram_username">Instagram</Label>
                        <Input id="instagram_username" v-model="form.instagram_username" required />
                        <p v-if="form.errors.instagram_username" class="text-destructive text-xs">
                            {{ form.errors.instagram_username }}
                        </p>
                    </div>

                    <div class="space-y-2 sm:col-span-2">
                        <Label for="personal_email">Email pribadi</Label>
                        <Input id="personal_email" v-model="form.personal_email" type="email" required />
                        <p v-if="form.errors.personal_email" class="text-destructive text-xs">
                            {{ form.errors.personal_email }}
                        </p>
                    </div>

                    <div class="space-y-2 sm:col-span-2">
                        <Label for="student_email">Email kampus</Label>
                        <Input id="student_email" v-model="form.student_email" type="email" required />
                        <p v-if="form.errors.student_email" class="text-destructive text-xs">
                            {{ form.errors.student_email }}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <!-- Akademik & divisi -->
            <Card class="border-border/70 rounded-2xl">
                <CardHeader class="pb-4">
                    <CardTitle class="text-base">Akademik &amp; divisi</CardTitle>
                    <p class="text-muted-foreground text-sm">Semester dan pilihan divisimu.</p>
                </CardHeader>
                <CardContent class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="semester">Semester</Label>
                        <SearchableSelect
                            id="semester"
                            v-model="form.semester"
                            :options="semesterOptions"
                            placeholder="Pilih semester"
                            aria-label="Semester"
                            :required="true"
                            :invalid="form.errors.semester !== undefined"
                        />
                        <p v-if="form.errors.semester" class="text-destructive text-xs">{{ form.errors.semester }}</p>
                    </div>

                    <div class="space-y-2">
                        <Label for="primary_division_id">Divisi utama</Label>
                        <SearchableSelect
                            id="primary_division_id"
                            v-model="form.primary_division_id"
                            :options="divisionOptions"
                            placeholder="Pilih divisi"
                            aria-label="Divisi utama"
                            :required="true"
                            :invalid="form.errors.primary_division_id !== undefined"
                        />
                        <p v-if="form.errors.primary_division_id" class="text-destructive text-xs">
                            {{ form.errors.primary_division_id }}
                        </p>
                    </div>

                    <div class="space-y-2 sm:col-span-2">
                        <Label for="secondary_division_id">Divisi cadangan</Label>
                        <SearchableSelect
                            id="secondary_division_id"
                            v-model="form.secondary_division_id"
                            :options="secondaryDivisionOptions"
                            placeholder="Pilih divisi cadangan"
                            aria-label="Divisi cadangan"
                            :invalid="form.errors.secondary_division_id !== undefined"
                        />
                        <p v-if="form.errors.secondary_division_id" class="text-destructive text-xs">
                            {{ form.errors.secondary_division_id }}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <!-- Berkas -->
            <Card class="border-border/70 rounded-2xl">
                <CardHeader class="pb-4">
                    <CardTitle class="text-base">Berkas</CardTitle>
                    <p class="text-muted-foreground text-sm">
                        CV, portfolio, bukti follow Instagram, dan tautan twibbon.
                    </p>
                </CardHeader>
                <CardContent class="space-y-5">
                    <div class="space-y-2">
                        <Label for="cv">CV (PDF)</Label>
                        <Input id="cv" type="file" accept="application/pdf" @change="onCvChange" />
                        <p class="text-muted-foreground text-xs">{{ cvHint }}</p>
                        <p v-if="form.errors.cv" class="text-destructive text-xs">{{ form.errors.cv }}</p>
                    </div>

                    <Separator />

                    <div class="space-y-3">
                        <Label id="portfolio-type-label">Portfolio (opsional)</Label>
                        <div
                            class="border-border/70 bg-muted/50 grid grid-cols-3 gap-1 rounded-lg border p-1"
                            role="radiogroup"
                            aria-labelledby="portfolio-type-label"
                        >
                            <button
                                type="button"
                                role="radio"
                                ref="portfolioNoneRadio"
                                :tabindex="form.portfolio_type === 'none' ? 0 : -1"
                                :aria-checked="form.portfolio_type === 'none'"
                                :class="[
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    form.portfolio_type === 'none'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                ]"
                                @click="form.portfolio_type = 'none'"
                                @keydown="onPortfolioTypeKeydown"
                            >
                                Tidak ada
                            </button>
                            <button
                                type="button"
                                role="radio"
                                ref="portfolioUrlRadio"
                                :tabindex="form.portfolio_type === 'url' ? 0 : -1"
                                :aria-checked="form.portfolio_type === 'url'"
                                :class="[
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    form.portfolio_type === 'url'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                ]"
                                @click="form.portfolio_type = 'url'"
                                @keydown="onPortfolioTypeKeydown"
                            >
                                URL
                            </button>
                            <button
                                type="button"
                                role="radio"
                                ref="portfolioFileRadio"
                                :tabindex="form.portfolio_type === 'file' ? 0 : -1"
                                :aria-checked="form.portfolio_type === 'file'"
                                :class="[
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    form.portfolio_type === 'file'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                ]"
                                @click="form.portfolio_type = 'file'"
                                @keydown="onPortfolioTypeKeydown"
                            >
                                File PDF
                            </button>
                        </div>
                        <p v-if="form.errors.portfolio_type" class="text-destructive text-xs">
                            {{ form.errors.portfolio_type }}
                        </p>
                        <Input
                            v-if="form.portfolio_type === 'url'"
                            v-model="form.portfolio_url"
                            placeholder="https://..."
                            aria-label="URL portfolio"
                        />
                        <div v-else-if="form.portfolio_type === 'file'" class="space-y-1">
                            <Input
                                id="portfolio_file"
                                type="file"
                                accept="application/pdf"
                                aria-label="File portfolio (opsional)"
                                @change="onPortfolioFileChange"
                            />
                            <p class="text-muted-foreground text-xs">
                                Opsional.
                                <span v-if="application.portfolio_original_name">
                                    File saat ini: {{ application.portfolio_original_name }}
                                </span>
                            </p>
                        </div>
                        <p v-if="form.errors.portfolio_url" class="text-destructive text-xs">
                            {{ form.errors.portfolio_url }}
                        </p>
                        <p v-if="form.errors.portfolio_file" class="text-destructive text-xs">
                            {{ form.errors.portfolio_file }}
                        </p>
                    </div>

                    <Separator />

                    <div class="space-y-2">
                        <Label for="instagram_follow_proof">Bukti Follow Instagram</Label>
                        <Input
                            id="instagram_follow_proof"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            @change="onInstagramFollowChange"
                        />
                        <p class="text-muted-foreground text-xs">{{ instagramFollowHint }}</p>
                        <p v-if="form.errors.instagram_follow_proof" class="text-destructive text-xs">
                            {{ form.errors.instagram_follow_proof }}
                        </p>
                    </div>

                    <div class="space-y-2">
                        <Label for="twibbon_url">Link Bukti Twibbon</Label>
                        <Input
                            id="twibbon_url"
                            v-model="form.twibbon_url"
                            type="url"
                            placeholder="https://..."
                            required
                        />
                        <p class="text-muted-foreground text-xs">
                            Twibbon dapat diakses di
                            <a
                                href="https://www.fotomomen.studio/oprec-doscom26"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary underline-offset-4 hover:underline"
                            >
                                https://www.fotomomen.studio/oprec-doscom26
                            </a>
                        </p>
                        <p v-if="form.errors.twibbon_url" class="text-destructive text-xs">
                            {{ form.errors.twibbon_url }}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button
                    type="submit"
                    :disabled="form.processing"
                    :aria-busy="form.processing"
                    class="sm:min-w-44"
                >
                    <CometSpinner v-if="form.processing" :size="16" />
                    {{ form.processing ? 'Menyimpan...' : 'Simpan perubahan' }}
                </Button>
                <Button as-child variant="outline">
                    <Link :href="dashboardUrl">Batal</Link>
                </Button>
            </div>
        </form>
        </template>

        <p class="text-muted-foreground mt-4 text-center text-xs">
            <Link :href="routes.recruitment.landing" class="underline-offset-2 hover:underline">
                Info OpenRecruitment
            </Link>
        </p>
    </div>
</template>
