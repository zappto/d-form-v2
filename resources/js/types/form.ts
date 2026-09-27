/**
 * Shared form / form-fill types (Inertia page props and payloads).
 * Keep page components thin — import from here instead of inlining large `type` blocks.
 */

import type { BackendField } from '@/components/modules/builder/fieldMapping';

/** Access gate for the public form fill route */
export type TFormAccessStatus =
    | 'allowed'
    | 'not_visible'
    | 'form_closed'
    | 'registration_not_open'
    | 'quota_full'
    | 'unsupported_registration_mode'
    | 'pending_team_confirmation'
    | 'invitation_closed'
    | 'already_submitted'
    | 'event_form_already_chosen'
    | 'prerequisite_not_met';

export type TFormPurpose = 'registration' | 'other';

export interface IFormSiblingOption {
    id: string;
    title: string;
}

export interface IFormFillPageEvent {
    id: string;
    slug: string;
    title: string;
}

export interface IFormFillPageForm {
    id: string;
    title: string;
    description: string | null;
    closed_at: string | null;
    banner_url: string | null;
    banner_caption: string | null;
}

/** Values stored in the fill `useForm` map (matches file inputs + multi-select) */
export type TFormFillAnswerValue = string | string[] | File | null;

export type TFormFillAnswerMap = Record<string, TFormFillAnswerValue>;

/** One row in checkbox / radio / dropdown image+label choices on the fill page */
export type TFormFillOptionRow = { type: 'text' | 'image'; label: string; imageSrc?: string };

/** Nilai JSON-like metadata field/form (rekursif); pengganti `unknown` longgar. */
export type TFormFieldMetadataValue =
    | string
    | number
    | boolean
    | null
    | TFormFieldRules
    | TFormFieldMetadataValue[]
    | { [key: string]: TFormFieldMetadataValue };

/** Validation rules nested under `metadata.rules` on API fields */
export type TFormFieldRules = {
    required?: boolean;
    in?: string;
    mimes?: string;
    max_size?: string | number;
    min?: number;
    max?: number;
} & TFormFieldMetadataBag;

/** Metadata bag JSON-like pada field/form; index signature dipertahankan untuk pembaca metadata. */
export type TFormFieldMetadataBag = { [key: string]: TFormFieldMetadataValue };

export interface IFormRegistrationMetadata {
    purpose: TFormPurpose;
    requires_form_id: string | null;
    registration_mode: 'single' | 'bundle' | 'team' | null;
    max_team_size: number | null;
    team_size: number | null;
}

/** Payload for creating a form from the dashboard builder */
export interface ICreateDashboardFormPayload {
    title: string;
    description: string;
    success_content: string;
    closed_at: string;
    visible_for: string[];
    banner_url: string;
    banner_caption: string;
    /** Payload metadata registrasi; `null` saat form belum diisi (init halaman create). */
    metadata: IFormRegistrationMetadata | null;
    fields: BackendField[];
}

/** Metadata registrasi form kosong untuk inisialisasi halaman create; dipakai saat form belum dikonfigurasi. */
export function emptyFormRegistrationMetadata(): IFormRegistrationMetadata {
    return {
        purpose: 'registration',
        requires_form_id: null,
        registration_mode: null,
        max_team_size: null,
        team_size: null,
    };
}

/** Parse metadata registrasi dari payload backend menjadi bentuk terketik dengan default aman; dipakai saat memuat form. */
export function parseFormRegistrationMetadata(raw: unknown): IFormRegistrationMetadata {
    const m = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as TFormFieldMetadataBag) : {};
    const purposeRaw = m['purpose'];
    const purpose: TFormPurpose = purposeRaw === 'other' ? 'other' : 'registration';
    const requiresRaw = m['requires_form_id'];
    const requires_form_id = typeof requiresRaw === 'string' && requiresRaw !== '' ? requiresRaw : null;
    const mode = m['registration_mode'];
    const rm = mode === 'single' || mode === 'bundle' || mode === 'team' ? mode : null;
    const maxTs = m['max_team_size'];
    const teamS = m['team_size'];
    return {
        purpose,
        requires_form_id,
        registration_mode: purpose === 'other' ? (rm === 'team' || rm === 'bundle' ? null : rm) : rm,
        max_team_size: maxTs != null && maxTs !== '' ? Number(maxTs) : null,
        team_size: teamS != null && teamS !== '' ? Number(teamS) : null,
    };
}

/**
 * Always send all registration keys so create/update round-trip reliably
 * (Inertia may omit nulls; partial objects used to wipe unrelated metadata).
 */
export function toFormMetadataPayload(m: IFormRegistrationMetadata): IFormRegistrationMetadata {
    const purpose = m.purpose === 'other' ? 'other' : 'registration';
    const isOther = purpose === 'other';
    return {
        purpose,
        requires_form_id:
            typeof m.requires_form_id === 'string' && m.requires_form_id !== '' ? m.requires_form_id : null,
        registration_mode: isOther
            ? m.registration_mode === 'single'
                ? 'single'
                : null
            : (m.registration_mode ?? null),
        max_team_size: isOther
            ? null
            : m.max_team_size != null && !Number.isNaN(Number(m.max_team_size))
              ? Number(m.max_team_size)
              : null,
        team_size: isOther
            ? null
            : m.team_size != null && !Number.isNaN(Number(m.team_size))
              ? Number(m.team_size)
              : null,
    };
}
