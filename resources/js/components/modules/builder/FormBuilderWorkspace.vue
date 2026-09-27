<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import FormPreviewDialog from '@/components/modules/builder/FormPreviewDialog.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import type { ITFormBannerState } from '@/components/modules/builder/formBanner';
import { FORM_VISIBILITY_OPTIONS } from '@/components/modules/builder/formBuilderPalette';
import type { BuilderField } from '@/types/form-builder';
import type { IFormRegistrationMetadata, IFormSiblingOption } from '@/types/form';
import { useFormBuilderWorkspace } from '@/hooks/useFormBuilderWorkspace';
import FormBuilderToolbar from './FormBuilderToolbar.vue';
import FormBuilderMobileTabBar from './FormBuilderMobileTabBar.vue';
import FormBuilderPalettePanel from './FormBuilderPalettePanel.vue';
import FormBuilderCanvasBuildView from './FormBuilderCanvasBuildView.vue';
import FormBuilderAddFieldSheet from './FormBuilderAddFieldSheet.vue';
import FormBuilderEditFieldSheet from './FormBuilderEditFieldSheet.vue';
import FormBuilderMobileAddFab from './FormBuilderMobileAddFab.vue';
import { routes } from '@/lib/routes';
import FormSettingsPanel from './FormSettingsPanel.vue';

const props = withDefaults(
    defineProps<{
        event: { id: string; title: string };
        toolbarSubtitle: string;
        saveLabel?: string;
        processing?: boolean;
        fieldErrors?: Partial<Record<'title' | 'description' | 'closed_at' | 'visible_for', string>>;
        shell?: 'dashboard' | 'fullscreen';
        siblingForms?: IFormSiblingOption[];
        hideToolbarTitles?: boolean;
        hideToolbar?: boolean;
    }>(),
    {
        saveLabel: 'Save Form',
        processing: false,
        fieldErrors: () => ({}),
        shell: 'dashboard',
        siblingForms: () => [],
        hideToolbarTitles: false,
        hideToolbar: false,
    }
);

const emit = defineEmits<{
    save: [];
}>();

const formTitle = defineModel<string>('formTitle', { required: true });
const formDescription = defineModel<string>('formDescription', { required: true });
const successContent = defineModel<string>('successContent', { required: true });
const closedAt = defineModel<string>('closedAt', { required: true });
const visibleFor = defineModel<string[]>('visibleFor', { required: true });
const banner = defineModel<ITFormBannerState>('banner', { required: true });
const formFields = defineModel<BuilderField[]>('formFields', { required: true });
const formMetadata = defineModel<IFormRegistrationMetadata>('formMetadata', { required: true });

const workspace = reactive(
    useFormBuilderWorkspace(
        {
            formTitle,
            formDescription,
            closedAt,
            visibleFor,
            banner,
            formFields,
            successContent,
        },
        { onSave: () => emit('save') }
    )
);

const backHref = computed(() => routes.admin.events.show(props.event.id));
const shellHeightClass = computed(() => (props.shell === 'fullscreen' ? 'h-svh' : 'min-h-0 lg:h-[calc(100svh-5rem)]'));
const visibilityOptions = FORM_VISIBILITY_OPTIONS;
/** Accordion "Pengaturan form" di panel kiri (bawaan tertutup). */
const formSettingsOpen = ref(false);
function toggleFormSettings(): void {
    formSettingsOpen.value = !formSettingsOpen.value;
}

/** Handle untuk aksi toolbar eksternal (Pratinjau / Save All) dari halaman induk. */
defineExpose({
    showPreview: () => {
        workspace.showPreview = true;
    },
    requestSave: () => workspace.requestSave(),
});
</script>

<template>
    <div :class="['flex min-h-0 flex-col overflow-visible lg:overflow-hidden', shellHeightClass]">
        <FormBuilderToolbar
            :back-href="backHref"
            :toolbar-subtitle="toolbarSubtitle"
            :heading-title="formTitle"
            :is-ready-to-save="workspace.isReadyToSave"
            :validation-issue-count="workspace.validationIssues.length"
            :is-empty="workspace.isEmpty"
            :processing="processing"
            :save-label="saveLabel"
            :hide-titles="hideToolbarTitles"
            :hide-toolbar="hideToolbar"
            @preview="workspace.showPreview = true"
            @save="workspace.requestSave"
        >
            <template #toolbar-extra>
                <slot name="toolbar-extra" />
            </template>
        </FormBuilderToolbar>

        <FormBuilderMobileTabBar
            v-model="workspace.mobileTab"
            :field-count="formFields.length"
            :is-ready-to-save="workspace.isReadyToSave"
        />

        <div class="flex flex-1 flex-col overflow-visible lg:flex-row lg:overflow-hidden">
            <FormBuilderPalettePanel
                v-model:search-query="workspace.searchQuery"
                v-model:closed-at="closedAt"
                v-model:visible-for="visibleFor"
                v-model:form-metadata="formMetadata"
                :categories="workspace.filteredCategories"
                :open-category-name="workspace.openCategoryName"
                :form-settings-open="formSettingsOpen"
                :field-errors="fieldErrors"
                :visibility-options="visibilityOptions"
                :sibling-forms="siblingForms"
                @toggle-category="workspace.toggleCategory"
                @toggle-form-settings="toggleFormSettings"
                @toggle-visibility="workspace.toggleVisibility"
            />

            <main class="relative min-h-0 flex-1 overflow-visible bg-background lg:overflow-y-auto">
                <FormBuilderCanvasBuildView
                    v-model:form-title="formTitle"
                    v-model:form-description="formDescription"
                    v-model:success-content="successContent"
                    v-model:banner="banner"
                    :field-errors="fieldErrors"
                    :show-success-zone="workspace.showSuccessZone"
                    :hide-on-mobile-settings="workspace.mobileTab === 'settings'"
                    :banner-preview-src="workspace.bannerPreviewSrc"
                    :is-empty="workspace.isEmpty"
                    :is-dragging-over-canvas="workspace.isDraggingOverCanvas"
                    :form-fields="formFields"
                    :selected-field-id="workspace.selectedFieldId"
                    :drop-indicator-index="workspace.dropIndicatorIndex"
                    :drag-source-id="workspace.dragSourceId"
                    @remove="workspace.hideSuccessZone"
                    @canvas-drag-over="workspace.onCanvasDragOver"
                    @canvas-drag-leave="workspace.onCanvasDragLeave"
                    @canvas-drop="workspace.onCanvasDrop"
                    @gap-drag-enter="workspace.onGapDragEnter"
                    @canvas-drag-start="workspace.onCanvasDragStart"
                    @drag-end="workspace.onDragEnd"
                    @select-field="workspace.selectField"
                    @update-field="workspace.updateField"
                    @manage-field="workspace.openFieldManage"
                    @delete-field="workspace.deleteField"
                    @duplicate-field="workspace.duplicateField"
                    @move-field="workspace.moveField"
                    @open-add-sheet="workspace.showAddSheet = true"
                />

                <div v-show="workspace.mobileTab === 'settings'" class="px-4 pt-5 pb-24 lg:hidden">
                    <div class="mx-auto max-w-[480px]">
                        <FormSettingsPanel
                            v-model:closed-at="closedAt"
                            v-model:visible-for="visibleFor"
                            v-model:form-metadata="formMetadata"
                            id-prefix="m"
                            :field-errors="fieldErrors"
                            :visibility-options="visibilityOptions"
                            :sibling-forms="siblingForms"
                            @toggle-visibility="workspace.toggleVisibility"
                        />
                    </div>
                </div>
            </main>

            <div class="mx-auto w-full max-w-[480px] px-4 pb-6 sm:hidden">
                <div class="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        class="h-11 border-border/80 bg-background text-sm font-medium shadow-sm"
                        :disabled="workspace.isEmpty"
                        aria-label="Pratinjau formulir"
                        @click="workspace.showPreview = true"
                    >
                        Pratinjau
                    </Button>
                    <Button
                        class="h-11 text-sm font-medium shadow-sm"
                        :disabled="processing"
                        :aria-busy="processing"
                        @click="workspace.requestSave"
                    >
                        <CometSpinner v-if="processing" :size="16" />
                        {{ processing ? 'Menyimpan...' : 'Simpan' }}
                    </Button>
                </div>
            </div>
        </div>
        <FormBuilderMobileAddFab
            v-if="workspace.mobileTab === 'build' && !workspace.isEmpty"
            @click="workspace.showAddSheet = true"
        />
    </div>

    <FormBuilderAddFieldSheet
        v-model:open="workspace.showAddSheet"
        v-model:search-query="workspace.searchQuery"
        :categories="workspace.filteredCategories"
        @pick-field="workspace.addField($event, false)"
    />

    <FormBuilderEditFieldSheet
        v-model:open="workspace.showMobileEditor"
        :field="workspace.selectedField"
        @update-field="workspace.updateField"
        @done="workspace.showMobileEditor = false"
    />

    <FormPreviewDialog
        :open="workspace.showPreview"
        :title="formTitle || 'Untitled Form'"
        :description="formDescription"
        :form-banner-url="workspace.bannerPreviewSrc"
        :form-banner-caption="banner.caption"
        :fields="formFields"
        @close="workspace.showPreview = false"
    />
</template>
