<script setup lang="ts">
import { ref } from 'vue';
import { Head, useForm } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';
import { handleInertiaFormErrors, humanizeErrorMessage } from '@/lib/error-message';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import FormBuilderWorkspace from '@/components/modules/builder/FormBuilderWorkspace.vue';
import {
    defaultFormBannerState,
    hasPendingBannerFile,
    prependFormBannerToBackendPayload,
    revokeBannerPreview,
} from '@/components/modules/builder/formBanner';
import { discardPendingOptionImageFiles, hasPendingOptionImageFiles } from '@/components/modules/builder/optionImage';
import { toBackendFields } from '@/components/modules/builder/fieldMapping';
import type { BuilderField } from '@/types/form-builder';
import type { CreateDashboardFormPayload, FormSiblingOption } from '@/types/form';
import { emptyFormRegistrationMetadata, toFormMetadataPayload } from '@/types/form';
import { routes } from '@/lib/routes';

/** Inertia `FormDataType` cannot recurse `BackendField.metadata` (Record<string, unknown>); store fields loosely for typing only. */
type CreateFormClientPayload = Omit<CreateDashboardFormPayload, 'fields'> & {
    fields: object[];
};

defineOptions({ layout: DashboardLayout });

const props = defineProps<{
    event: { id: string; title: string };
    siblingForms?: FormSiblingOption[];
}>();

const formTitle = ref<string>('');
const formDescription = ref<string>('');
const successContent = ref<string>('');
const closedAt = ref<string>('');
const visibleFor = ref<string[]>([]);
const bannerState = ref(defaultFormBannerState());
const formFields = ref<BuilderField[]>([]);
const formMetadata = ref(emptyFormRegistrationMetadata());
const isSaving = ref<boolean>(false);

const createForm = useForm<CreateFormClientPayload>({
    title: '',
    description: '',
    success_content: '',
    closed_at: '',
    visible_for: [],
    banner_url: '',
    banner_caption: '',
    metadata: null,
    fields: [],
});

function onSave(): void {
    // Form belum ada (tanpa id) sehingga file banner tak bisa diupload via
    // POST /fields di sini — DB hanya path. Buang file pending agar tak
    // tersimpan sebagai baris banner ber-url kosong; pengguna unggah ulang
    // di halaman edit setelah form terbuat.
    if (hasPendingBannerFile(bannerState.value)) {
        revokeBannerPreview(bannerState.value);
        bannerState.value.bannerFile = null;
        bannerState.value.bannerPreviewUrl = '';
        bannerState.value.bannerUrl = '';
        bannerState.value.bannerFileName = '';
        toast.error('Banner belum terunggah — buat form dulu, lalu unggah banner di halaman edit.');
    }
    // Opsi gambar: File mentah tak bisa ikut via POST store di sini (tanpa
    // id) — buang file pending agar tak ada base64 yang tertulis; URL teks
    // yang diketik manual tetap tersimpan, file diunggah ulang di edit.
    if (hasPendingOptionImageFiles(formFields.value)) {
        discardPendingOptionImageFiles(formFields.value);
        toast.error('Gambar opsi belum terunggah — buat form dulu, lalu unggah di halaman edit.');
    }
    createForm.title = formTitle.value;
    createForm.description = formDescription.value;
    createForm.success_content = successContent.value;
    createForm.closed_at = closedAt.value;
    createForm.visible_for = visibleFor.value;
    createForm.banner_url = bannerState.value.bannerUrl;
    createForm.banner_caption = bannerState.value.caption;
    createForm.metadata = toFormMetadataPayload(formMetadata.value);

    const merged = prependFormBannerToBackendPayload(formFields.value, bannerState.value);
    createForm.fields = toBackendFields(merged) as object[];

    isSaving.value = true;
    createForm.post(routes.admin.events.forms.store(props.event.id), {
        onSuccess: () => toast.success(humanizeErrorMessage('Form created successfully!')),
        onError: (errors) => {
            handleInertiaFormErrors(errors, { title: 'Gagal membuat form' });
        },
        onFinish: () => {
            isSaving.value = false;
        },
    });
}
</script>

<template>
    <Head title="Create Form" />

    <FormBuilderWorkspace
        v-model:form-title="formTitle"
        v-model:form-description="formDescription"
        v-model:success-content="successContent"
        v-model:closed-at="closedAt"
        v-model:visible-for="visibleFor"
        v-model:banner="bannerState"
        v-model:form-fields="formFields"
        v-model:form-metadata="formMetadata"
        :event="event"
        :sibling-forms="siblingForms ?? []"
        :toolbar-subtitle="`New form for ${event.title}`"
        save-label="Save Form"
        :processing="isSaving"
        :hide-toolbar-titles="true"
        @save="onSave"
    />
</template>
