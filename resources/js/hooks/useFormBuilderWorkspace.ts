import { ref, computed, type Ref } from 'vue';
import { useErrorToast } from './useErrorToast';
import { hasMeaningfulHtmlText } from '@/lib/htmlText';
import { resolveBannerPreviewSrc, type ITFormBannerState } from '@/components/modules/builder/formBanner';
import {
    cloneFormBuilderPalette,
    type ITFormBuilderPaletteCategory,
    type ITFormBuilderPaletteField,
} from '@/components/modules/builder/formBuilderPalette';
import { createFormBuilderField } from '@/components/modules/builder/formBuilderFieldFactory';
import type { BuilderField } from '@/types/formBuilder';

export type TFormBuilderInspectorMode = 'settings' | 'field';
export type TFormBuilderMobileTab = 'build' | 'settings';

export interface IFormBuilderValidationIssue {
    key: 'title' | 'description' | 'closedAt' | 'visibleFor' | 'fields';
    label: string;
}

export interface IFormBuilderWorkspaceModels {
    formTitle: Ref<string>;
    formDescription: Ref<string>;
    closedAt: Ref<string>;
    visibleFor: Ref<string[]>;
    banner: Ref<ITFormBannerState>;
    formFields: Ref<BuilderField[]>;
    successContent?: Ref<string>;
}

/** Argumen mulai-drag kartu kanvas (event drag + field + indeks asal). */
export interface ICanvasDragStartArgs {
    dragEvent: DragEvent;
    field: BuilderField;
    index: number;
}

/** Kategori palette terbuka. `null` = semua tertutup (single-expand). */
export function useFormBuilderWorkspace(models: IFormBuilderWorkspaceModels, options: { onSave: () => void }) {
    const { showErrorToast } = useErrorToast();
    const categories = ref<ITFormBuilderPaletteCategory[]>(cloneFormBuilderPalette());

    /** Single-expand: simpan nama kategori yang terbuka (default semua tertutup). */
    const openCategoryName = ref<string | null>(null);

    const searchQuery = ref<string>('');
    const selectedFieldId = ref<string | null>(null);
    const dropIndicatorIndex = ref<number>(-1);
    const isDraggingOverCanvas = ref<boolean>(false);
    const dragSourceId = ref<string | null>(null);
    const inspectorMode = ref<TFormBuilderInspectorMode>('settings');
    const mobileTab = ref<TFormBuilderMobileTab>('build');
    const showAddSheet = ref<boolean>(false);
    const showMobileEditor = ref<boolean>(false);
    const showPreview = ref<boolean>(false);

    /** Zona "Pesan setelah submit" (ala Google Forms). `true` = canvas menampilkan zona (dipicu drag item palette). */
    const showSuccessZone = ref(false);

    // Edit form tersimpan: konten sudah ada saat mount → tampilkan zona.
    const initialSuccess = models.successContent?.value ?? '';
    if (hasMeaningfulHtmlText(initialSuccess)) {
        showSuccessZone.value = true;
    }

    const filteredCategories = computed(() => {
        const q = searchQuery.value.toLowerCase().trim();
        if (!q) return categories.value;
        // Mode pencarian: tampilkan semua kategori yang cocok (abaikan single-expand).
        return categories.value
            .map((cat) => ({
                ...cat,
                isOpen: true,
                fields: cat.fields.filter(
                    (f) =>
                        f.label.toLowerCase().includes(q) ||
                        f.description.toLowerCase().includes(q) ||
                        f.type.includes(q)
                ),
            }))
            .filter((cat) => cat.fields.length > 0);
    });

    const selectedField = computed<BuilderField | null>(
        () => models.formFields.value.find((f) => f.id === selectedFieldId.value) ?? null
    );

    const isEmpty = computed<boolean>(() => models.formFields.value.length === 0);
    const bannerPreviewSrc = computed<string>(() => resolveBannerPreviewSrc(models.banner.value));

    const validationIssues = computed<IFormBuilderValidationIssue[]>(() => {
        const issues: IFormBuilderValidationIssue[] = [];
        if (!models.formTitle.value.trim()) issues.push({ key: 'title', label: 'Form title' });
        if (!models.formDescription.value.trim()) issues.push({ key: 'description', label: 'Description' });
        if (!models.closedAt.value) issues.push({ key: 'closedAt', label: 'Close date' });
        if (models.visibleFor.value.length === 0) issues.push({ key: 'visibleFor', label: 'Visibility' });
        if (models.formFields.value.length === 0) issues.push({ key: 'fields', label: 'At least one field' });
        return issues;
    });

    const isReadyToSave = computed<boolean>(() => validationIssues.value.length === 0);

    function patchBanner(v: ITFormBannerState): void {
        Object.assign(models.banner.value, v);
    }

    function hideSuccessZone(): void {
        showSuccessZone.value = false;
        if (models.successContent) models.successContent.value = '';
    }

    function addField(template: ITFormBuilderPaletteField, openEditorAfter = false): void {
        // Item palette "Pesan setelah submit" = trigger zona konfirmasi, bukan BuilderField.
        if (template.type === 'confirmation') {
            showSuccessZone.value = true;
            showAddSheet.value = false;
            if (openEditorAfter) showMobileEditor.value = true;
            return;
        }
        const nf = createFormBuilderField(template.type, template.label);
        models.formFields.value = [...models.formFields.value, nf];
        selectedFieldId.value = nf.id;
        inspectorMode.value = 'field';
        showAddSheet.value = false;
        if (openEditorAfter) showMobileEditor.value = true;
    }

    function selectField(id: string, isMobile = false): void {
        if (selectedFieldId.value === id && !isMobile) {
            selectedFieldId.value = null;
            inspectorMode.value = 'settings';
            return;
        }
        selectedFieldId.value = id;
        inspectorMode.value = 'field';
        if (isMobile) showMobileEditor.value = true;
    }

    function deleteField(id: string): void {
        models.formFields.value = models.formFields.value.filter((f) => f.id !== id);
        if (selectedFieldId.value === id) {
            selectedFieldId.value = null;
            inspectorMode.value = 'settings';
            showMobileEditor.value = false;
        }
    }

    /** Buka sheet kelola opsi / pengaturan field dari aksi kartu — jangan toggle-off bila sudah terpilih. */
    function openFieldManage(id: string): void {
        selectedFieldId.value = id;
        inspectorMode.value = 'field';
        showMobileEditor.value = true;
    }

    function duplicateField(id: string): void {
        const i = models.formFields.value.findIndex((f) => f.id === id);
        if (i === -1) return;
        const copy = JSON.parse(JSON.stringify(models.formFields.value[i])) as BuilderField;
        copy.id = crypto.randomUUID();
        copy.name = `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
        // Duplikat = baris baru: buang order bawaan agar spaced ordering
        // mengalokasikan midpoint sesudah aslinya (hindari order ganda).
        copy.order = undefined;
        const next = [...models.formFields.value];
        next.splice(i + 1, 0, copy);
        models.formFields.value = next;
        selectedFieldId.value = copy.id;
        inspectorMode.value = 'field';
    }

    function updateField(updated: BuilderField): void {
        const i = models.formFields.value.findIndex((f) => f.id === updated.id);
        if (i === -1) return;
        const next = [...models.formFields.value];
        next[i] = updated;
        models.formFields.value = next;
    }

    function moveField(id: string, direction: -1 | 1): void {
        const i = models.formFields.value.findIndex((f) => f.id === id);
        if (i === -1) return;
        const target = i + direction;
        if (target < 0 || target >= models.formFields.value.length) return;
        const next = [...models.formFields.value];
        const [moved] = next.splice(i, 1);
        next.splice(target, 0, moved);
        models.formFields.value = next;
    }

    function toggleVisibility(value: string, checked: boolean): void {
        if (checked) models.visibleFor.value = [...models.visibleFor.value, value];
        else models.visibleFor.value = models.visibleFor.value.filter((v) => v !== value);
    }

    function toggleCategory(cat: ITFormBuilderPaletteCategory): void {
        openCategoryName.value = openCategoryName.value === cat.name ? null : cat.name;
        // Sinkronkan isOpen agar cocok dengan state yang dipakai item kartu.
        for (const c of categories.value) {
            c.isOpen = c.name === openCategoryName.value;
        }
    }

    function onGapDragEnter(index: number): void {
        dropIndicatorIndex.value = index;
    }

    function onCanvasDragOver(e: DragEvent): void {
        e.preventDefault();
        const dt = e.dataTransfer;
        if (dt) {
            /** Drag dari palet: belum ada dragSourceId; tandai agar UI drop (ring kanvas) muncul */
            if (!dragSourceId.value && Array.from(dt.types).includes('application/json')) {
                isDraggingOverCanvas.value = true;
            }
            dt.dropEffect = dragSourceId.value ? 'move' : 'copy';
        }
        if (dropIndicatorIndex.value === -1 && isEmpty.value) dropIndicatorIndex.value = 0;
    }

    function onCanvasDragLeave(e: DragEvent): void {
        if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            dropIndicatorIndex.value = -1;
            isDraggingOverCanvas.value = false;
        }
    }

    function onCanvasDrop(e: DragEvent): void {
        e.preventDefault();
        const raw = e.dataTransfer?.getData('application/json');
        if (!raw) return;
        const data = JSON.parse(raw) as { isNew?: boolean; type?: string; label?: string; id?: string };
        // Drop item "Pesan setelah submit" = trigger zona konfirmasi di akhir canvas, bukan BuilderField.
        if (data.isNew && data.type === 'confirmation') {
            showSuccessZone.value = true;
            dropIndicatorIndex.value = -1;
            isDraggingOverCanvas.value = false;
            dragSourceId.value = null;
            return;
        }
        const insertAt = dropIndicatorIndex.value < 0 ? models.formFields.value.length : dropIndicatorIndex.value;
        const list = [...models.formFields.value];
        if (data.isNew && data.type && data.label) {
            const nf = createFormBuilderField(data.type as TFormBuilderType, data.label);
            list.splice(insertAt, 0, nf);
            models.formFields.value = list;
            selectedFieldId.value = nf.id;
            inspectorMode.value = 'field';
        } else if (data.id) {
            const from = list.findIndex((f) => f.id === data.id);
            if (from === -1) return;
            const [moved] = list.splice(from, 1);
            list.splice(insertAt > from ? insertAt - 1 : insertAt, 0, moved);
            models.formFields.value = list;
            selectedFieldId.value = moved.id;
            inspectorMode.value = 'field';
        }
        dropIndicatorIndex.value = -1;
        isDraggingOverCanvas.value = false;
        dragSourceId.value = null;
    }

    /** Tandai sumber drag kartu kanvas + titipkan payload pindah ke dataTransfer; dipakai kanvas builder. */
    function onCanvasDragStart(args: ICanvasDragStartArgs): void {
        dragSourceId.value = args.field.id;
        if (args.dragEvent.dataTransfer) {
            args.dragEvent.dataTransfer.effectAllowed = 'move';
            args.dragEvent.dataTransfer.setData(
                'application/json',
                JSON.stringify({ id: args.field.id, fromIndex: args.index, isNew: false })
            );
        }
        requestAnimationFrame(() => {
            isDraggingOverCanvas.value = true;
        });
    }

    function onDragEnd(): void {
        dropIndicatorIndex.value = -1;
        isDraggingOverCanvas.value = false;
        dragSourceId.value = null;
    }

    function requestSave(): void {
        if (validationIssues.value.length > 0) {
            showErrorToast(`Field belum lengkap: ${validationIssues.value.map((i) => i.label).join(', ')}`, {
                title: 'Form belum siap disimpan',
            });
            mobileTab.value = 'settings';
            inspectorMode.value = 'settings';
            return;
        }
        options.onSave();
    }

    return {
        categories,
        searchQuery,
        filteredCategories,
        openCategoryName,
        showSuccessZone,
        selectedFieldId,
        selectedField,
        dropIndicatorIndex,
        isDraggingOverCanvas,
        dragSourceId,
        inspectorMode,
        mobileTab,
        showAddSheet,
        showMobileEditor,
        showPreview,
        isEmpty,
        bannerPreviewSrc,
        validationIssues,
        isReadyToSave,
        patchBanner,
        addField,
        selectField,
        openFieldManage,
        deleteField,
        duplicateField,
        updateField,
        moveField,
        toggleVisibility,
        toggleCategory,
        hideSuccessZone,
        onGapDragEnter,
        onCanvasDragOver,
        onCanvasDragLeave,
        onCanvasDrop,
        onCanvasDragStart,
        onDragEnd,
        requestSave,
    };
}
