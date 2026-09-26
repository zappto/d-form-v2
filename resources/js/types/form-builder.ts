export type FieldOptionType = 'text' | 'image'

export interface FieldOptionEntry {
    id: string
    type: FieldOptionType
    label: string
    imageUrl?: string
    /** File baru yang belum terupload — tidak diserialisasi ke DB, hanya di state. */
    imageFile?: File | null
    /** Object URL untuk preview file baru — tidak diserialisasi ke DB. */
    imagePreviewUrl?: string
}

export interface BuilderField {
    id: string
    type: string
    label: string
    description: string
    name: string
    placeholder: string
    required: boolean
    options: FieldOptionEntry[]
    metadata: Record<string, unknown>
    /** Field may be edited by invited members (team flow); persisted as `form_fields.is_append`. */
    is_append?: boolean
    /**
     * Persisted backend `order` carried on the canvas to avoid renumbering.
     * Undefined for brand-new rows (allocated via spaced ordering on save).
     */
    order?: number
}

export type BackendFieldType = 'input' | 'select' | 'textarea' | 'datePicker' | 'fileUpload' | 'checkbox' | 'radio'

export interface BackendField {
    id: string
    type: BackendFieldType
    label: string
    description: string | null
    name: string
    order: number
    metadata: Record<string, unknown>
    is_append?: boolean
}
