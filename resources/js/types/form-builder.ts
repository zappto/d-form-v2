import type { TFormFieldMetadataBag } from '@/types/form';

export type TFieldOptionType = 'text' | 'image';

export interface IFieldOptionEntry {
    id: string;
    type: TFieldOptionType;
    label: string;
    imageUrl?: string;
    /** File baru yang belum terupload — tidak diserialisasi ke DB, hanya di state. */
    imageFile?: File | null;
    /** Object URL untuk preview file baru — tidak diserialisasi ke DB. */
    imagePreviewUrl?: string;
}

export interface BuilderField {
    id: string;
    type: string;
    label: string;
    description: string;
    name: string;
    placeholder: string;
    required: boolean;
    options: IFieldOptionEntry[];
    metadata: TFormFieldMetadataBag;
    /** Field may be edited by invited members (team flow); persisted as `form_fields.is_append`. */
    is_append?: boolean;
    /**
     * Persisted backend `order` carried on the canvas to avoid renumbering.
     * Undefined for brand-new rows (allocated via spaced ordering on save).
     */
    order?: number;
}

export type TBackendFieldType =
    | 'input'
    | 'select'
    | 'textarea'
    | 'datePicker'
    | 'fileUpload'
    | 'checkbox'
    | 'radio'
    | 'banner';

export interface BackendField {
    id: string;
    type: TBackendFieldType;
    label: string;
    description: string | null;
    name: string;
    order: number;
    metadata: TFormFieldMetadataBag;
    is_append?: boolean;
}
