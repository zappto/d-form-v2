/**
 * Shared recruitment application DTOs (Inertia page props and payloads).
 * Keep components thin — import from here instead of declaring shapes inside `.vue`.
 */

import type { TFormFieldMetadataValue } from '@/types/form';

/** Nilai tunggal payload diff koreksi activity log backend (JSON-like rekursif). */
type TApplicantCorrectionValue = TFormFieldMetadataValue;

/** Peta payload diff koreksi (`old_values`/`new_values`): kunci field → nilai JSON-like. */
type TApplicantCorrectionMap = Record<string, TApplicantCorrectionValue>;

interface IScreeningRow {
    id: string;
    decision: string;
    decision_label: string;
    reason: string | null;
    reason_label: string | null;
    notes: string | null;
    acted_at: string | null;
    actor: { id: string; name: string } | null;
}

interface IActivityRow {
    id: string;
    action: string;
    old_values: TApplicantCorrectionMap | null;
    new_values: TApplicantCorrectionMap | null;
    created_at: string | null;
    actor: { id: string; name: string } | null;
}

interface ICorrectionRow {
    id: string;
    status: string;
    status_label: string;
    request_message: string;
    review_notes: string | null;
    reviewed_at: string | null;
    completed_at: string | null;
    reviewer: { id: string; name: string } | null;
}

interface IEvaluationDetail {
    speaking_score: number;
    technical_score: number;
    attitude_score: number;
    recommendation: string;
    recommendation_label: string;
    notes: string | null;
    is_locked: boolean;
    evaluated_at: string | null;
    evaluator: { id: string; name: string } | null;
}

interface IFinalDecisionDetail {
    membership_type: string | null;
    membership_type_label: string | null;
    final_division: { id: string; name: string; code: string } | null;
    internal_reason: string | null;
    public_message: string | null;
    decided_at: string | null;
    decider: { id: string; name: string } | null;
}

export interface IApplicationDetail {
    id: string;
    registration_number: string;
    full_name: string;
    nim: string;
    semester: number;
    phone: string;
    personal_email: string;
    student_email: string;
    instagram_username: string;
    stage: string;
    stage_label: string;
    result: string;
    result_label: string;
    is_verified: boolean;
    revision_required: boolean;
    submitted_at: string | null;
    period: { id: string; name: string } | null;
    primary_division: { id: string; name: string; code: string } | null;
    secondary_division: { id: string; name: string; code: string } | null;
    document: {
        cv_original_name: string;
        cv_mime: string;
        cv_size_bytes: number;
        portfolio_type: string;
        portfolio_url: string | null;
        portfolio_original_name: string | null;
        portfolio_mime: string | null;
        portfolio_size_bytes: number | null;
        instagram_follow_original_name: string | null;
        instagram_follow_mime: string | null;
        instagram_follow_size_bytes: number | null;
        twibbon_url: string | null;
        has_cv_file: boolean;
        has_portfolio_file: boolean;
        has_instagram_follow_file: boolean;
    } | null;
    screenings: IScreeningRow[];
    activity_logs: IActivityRow[];
    correction_requests: ICorrectionRow[];
    evaluation: IEvaluationDetail | null;
    final_decision: IFinalDecisionDetail | null;
    can_screen: boolean;
    can_verify: boolean;
    can_decide_final: boolean;
    can_resend_tracking: boolean;
}
