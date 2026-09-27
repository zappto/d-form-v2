<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from '@inertiajs/vue3';
import FormSheet from './FormSheet.vue';
import { Button } from '@/components/ui/button';
import CometSpinner from '@/components/core/CometSpinner.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect, { type SearchableSelectOption } from '@/components/core/SearchableSelect.vue';
import { routes } from '@/lib/routes';
import { useErrorToast } from '@/hooks/useErrorToast';
import { SAVING_LABEL } from '@/lib/uiLabels';
import { Eye, EyeOff } from 'lucide-vue-next';

const { handleInertiaFormErrors } = useErrorToast();

export interface InterviewerDivisionChoice {
    id: string;
    name: string;
    code: string;
}

const props = withDefaults(
    defineProps<{
        open: boolean;
        divisions: InterviewerDivisionChoice[];
        initialDivisionId?: string;
    }>(),
    { initialDivisionId: '' }
);

const emit = defineEmits<{ close: []; created: [email: string] }>();

const sheetOpen = computed<boolean>({
    get: () => props.open,
    set: (value: boolean) => {
        if (!value) emit('close');
    },
});

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    recruitment_division_id: '',
});

const showPassword = ref<boolean>(false);
const showPasswordConfirmation = ref<boolean>(false);

type TInterviewerRoutes = {
    assign: string;
    unassign: (id: string) => string;
    store?: string;
};

const interviewerRoutes = computed<TInterviewerRoutes>(() => routes.admin.recruitment.interviewers);

/** Selaras dengan kontrak backend lane paralel; fallback dipakai sampai helper store mendarat. */
const storeUrl = computed<string>(() => interviewerRoutes.value.store ?? '/admin/recruitment/interviewers');

const divisionOptions = computed<SearchableSelectOption[]>(() =>
    props.divisions.map((d) => ({
        value: d.id,
        label: d.name,
        sublabel: d.code,
        initials: d.code.slice(0, 2).toUpperCase(),
    }))
);

const canSubmit = computed<boolean>(() => {
    return (
        form.name.trim().length > 0 &&
        form.email.trim().length > 0 &&
        form.password.length > 0 &&
        form.password_confirmation.length > 0 &&
        form.recruitment_division_id.length > 0 &&
        !form.processing
    );
});

watch(
    () => props.open,
    (isOpen: boolean) => {
        if (isOpen) {
            form.clearErrors();
            if (form.recruitment_division_id === '' && props.initialDivisionId !== '') {
                form.recruitment_division_id = props.initialDivisionId;
            }
        } else {
            form.reset();
            form.clearErrors();
            showPassword.value = false;
            showPasswordConfirmation.value = false;
        }
    }
);

function submit(): void {
    if (!canSubmit.value) return;
    form.post(storeUrl.value, {
        preserveScroll: true,
        onSuccess: () => {
            // Tanpa toast manual: sukses sudah ditampilkan global oleh usePageFlashToast
            // dari flash `toast` server (RecruitmentDivisionController::storeInterviewer).
            emit('created', form.email);
            emit('close');
        },
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal menambah interviewer' });
        },
    });
}
</script>

<template>
    <FormSheet
        v-model:open="sheetOpen"
        title="Tambah interviewer"
        description="Buat akun baru sekaligus tugaskan sebagai interviewer"
    >
        <template #footer>
            <div class="flex gap-2">
                <Button variant="outline" type="button" class="flex-1" @click="emit('close')"> Batal </Button>
                <Button
                    type="submit"
                    form="interviewer-create-form"
                    class="flex-1"
                    :disabled="!canSubmit"
                    :aria-busy="form.processing"
                >
                    <CometSpinner v-if="form.processing" :size="16" />
                    {{ form.processing ? SAVING_LABEL : 'Simpan interviewer' }}
                </Button>
            </div>
        </template>

        <form id="interviewer-create-form" class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
            <div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
                <section class="space-y-3" aria-label="Data user">
                    <h3 class="text-sm font-semibold">Data user</h3>
                    <div class="space-y-2">
                        <Label for="new-interviewer-name">Nama</Label>
                        <Input
                            id="new-interviewer-name"
                            v-model="form.name"
                            type="text"
                            placeholder="Nama lengkap"
                            autocomplete="name"
                            :aria-invalid="form.errors.name ? true : undefined"
                        />
                        <p v-if="form.errors.name" role="alert" class="text-xs text-destructive">
                            {{ form.errors.name }}
                        </p>
                    </div>
                    <div class="space-y-2">
                        <Label for="new-interviewer-email">Email</Label>
                        <Input
                            id="new-interviewer-email"
                            v-model="form.email"
                            type="email"
                            placeholder="nama@contoh.id"
                            autocomplete="email"
                            :aria-invalid="form.errors.email ? true : undefined"
                        />
                        <p v-if="form.errors.email" role="alert" class="text-xs text-destructive">
                            {{ form.errors.email }}
                        </p>
                    </div>
                    <div class="space-y-2">
                        <Label for="new-interviewer-password">Kata sandi</Label>
                        <div class="relative">
                            <Input
                                id="new-interviewer-password"
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Minimal 8 karakter"
                                autocomplete="new-password"
                                class="pr-10"
                                :aria-invalid="form.errors.password ? true : undefined"
                            />
                            <button
                                type="button"
                                class="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                                @click="showPassword = !showPassword"
                            >
                                <EyeOff v-if="showPassword" class="size-4" aria-hidden="true" />
                                <Eye v-else class="size-4" aria-hidden="true" />
                            </button>
                        </div>
                        <p v-if="form.errors.password" role="alert" class="text-xs text-destructive">
                            {{ form.errors.password }}
                        </p>
                    </div>
                    <div class="space-y-2">
                        <Label for="new-interviewer-password-confirmation">Konfirmasi kata sandi</Label>
                        <div class="relative">
                            <Input
                                id="new-interviewer-password-confirmation"
                                v-model="form.password_confirmation"
                                :type="showPasswordConfirmation ? 'text' : 'password'"
                                placeholder="Ulangi kata sandi"
                                autocomplete="new-password"
                                class="pr-10"
                                :aria-invalid="form.errors.password_confirmation ? true : undefined"
                            />
                            <button
                                type="button"
                                class="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                :aria-label="
                                    showPasswordConfirmation
                                        ? 'Sembunyikan konfirmasi kata sandi'
                                        : 'Tampilkan konfirmasi kata sandi'
                                "
                                @click="showPasswordConfirmation = !showPasswordConfirmation"
                            >
                                <EyeOff v-if="showPasswordConfirmation" class="size-4" aria-hidden="true" />
                                <Eye v-else class="size-4" aria-hidden="true" />
                            </button>
                        </div>
                        <p v-if="form.errors.password_confirmation" role="alert" class="text-xs text-destructive">
                            {{ form.errors.password_confirmation }}
                        </p>
                    </div>
                </section>

                <section class="space-y-3" aria-label="Tugaskan langsung">
                    <div>
                        <h3 class="text-sm font-semibold">Tugaskan langsung</h3>
                        <p class="mt-0.5 text-xs text-muted-foreground">
                            Interviewer baru langsung ditugaskan ke divisi ini.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <Label for="new-interviewer-division">Divisi</Label>
                        <SearchableSelect
                            id="new-interviewer-division"
                            v-model="form.recruitment_division_id"
                            :options="divisionOptions"
                            placeholder="Pilih divisi"
                            search-placeholder="Cari divisi…"
                            :aria-invalid="form.errors.recruitment_division_id ? true : undefined"
                        />
                        <p v-if="form.errors.recruitment_division_id" role="alert" class="text-xs text-destructive">
                            {{ form.errors.recruitment_division_id }}
                        </p>
                    </div>
                </section>
            </div>
        </form>
    </FormSheet>
</template>
