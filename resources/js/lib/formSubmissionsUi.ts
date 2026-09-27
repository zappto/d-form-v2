import { formatSubmissionDateTime } from './format';

/** Format tanggal-waktu submission ke tampilan id-ID; dipakai di tabel/detail submission. */
export function formatSubmissionDate(value: string): string {
    return formatSubmissionDateTime(value);
}

/** Ubah key jawaban menjadi label dari peta field, fallback nama ber-spasi; dipakai saat menampilkan jawaban. */
export function humanizeSubmissionKey(fieldLabelMap: Record<string, string>, value: string): string {
    return fieldLabelMap[value] || value.replace(/^field_/, '').replace(/_/g, ' ');
}

import { normalizeBannerSrc } from '@/lib/bannerSrc';
import type { TFormFillAnswerValue } from '@/types/form';

/** Buat pratinjau singkat nilai jawaban untuk daftar; dipakai di ringkasan jawaban submission. */
export function answerPreview(value: TFormFillAnswerValue | undefined): string {
    if (Array.isArray(value)) return value.map(String).join(', ');
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return 'Jawaban terstruktur';
}

/** Resolve URL berkas jawaban submission atau null bila kosong; dipakai untuk tautan unduh lampiran. */
export function submissionFileUrl(value: TFormFillAnswerValue | undefined): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const t = value.trim();
    if (!t) {
        return null;
    }
    return normalizeBannerSrc(t);
}

/** Terjemahkan label pagination bawaan (Previous/Next) ke Bahasa Indonesia; dipakai di kontrol pagination submission. */
export function submissionPaginationLabel(value: string): string {
    return value
        .replace('&laquo;', 'Sebelumnya')
        .replace('&raquo;', 'Berikutnya')
        .replace('Previous', 'Sebelumnya')
        .replace('Next', 'Berikutnya');
}

/** True when admin must not accept until the member confirms (team / bundle). */
export function submissionAdminAcceptBlocked(sub: {
    registration_role?: string | null;
    member_confirmation_status?: string | null;
}): boolean {
    return sub.registration_role === 'member' && sub.member_confirmation_status !== 'accepted';
}

/** Matches {@see App\Enums\FormAnswerReviewStatus} — pending answers can be reviewed. */
export function formSubmissionReviewIsPending(submission: {
    review_status?: 'pending' | 'accepted' | 'rejected' | null;
}): boolean {
    return submission.review_status == null || submission.review_status === 'pending';
}

/** Label + kelas untuk badge status review (Bahasa Indonesia). */
export function submissionReviewBadge(status: 'pending' | 'accepted' | 'rejected' | null | undefined): {
    label: string;
    class: string;
} {
    if (status === 'accepted') {
        return {
            label: 'Diterima',
            class: 'border-success/30 bg-success/10 text-success',
        };
    }
    if (status === 'rejected') {
        return {
            label: 'Ditolak',
            class: 'border-destructive/25 bg-destructive/10 text-destructive',
        };
    }
    return {
        label: 'Menunggu review',
        class: 'border-warning/30 bg-warning/10 text-warning',
    };
}

/** Label untuk status konfirmasi anggota (Bahasa Indonesia). */
export function memberConfirmationStatusLabel(
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | null | undefined
): string {
    if (status === 'accepted') return 'Diterima';
    if (status === 'rejected') return 'Ditolak';
    if (status === 'expired') return 'Kedaluwarsa';
    if (status === 'pending') return 'Menunggu';
    return '—';
}

/** Badge classes untuk status konfirmasi anggota. */
export function memberConfirmationStatusBadge(
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | null | undefined
): { label: string; class: string } {
    if (status === 'accepted') {
        return {
            label: 'Diterima',
            class: 'border-success/30 bg-success/10 text-success',
        };
    }
    if (status === 'rejected') {
        return {
            label: 'Ditolak',
            class: 'border-destructive/25 bg-destructive/10 text-destructive',
        };
    }
    if (status === 'expired') {
        return {
            label: 'Kedaluwarsa',
            class: 'border-muted-foreground/25 bg-muted/20 text-muted-foreground',
        };
    }
    return {
        label: 'Menunggu',
        class: 'border-warning/30 bg-warning/10 text-warning',
    };
}

/** Label untuk status review group. */
export function groupReviewStatusLabel(status: 'pending' | 'partial' | 'accepted' | 'rejected'): string {
    if (status === 'accepted') return 'Semua diterima';
    if (status === 'rejected') return 'Ditolak';
    if (status === 'partial') return 'Sebagian direview';
    return 'Menunggu review';
}

/** Badge classes untuk status review group. */
export function groupReviewStatusBadge(status: 'pending' | 'partial' | 'accepted' | 'rejected'): {
    label: string;
    class: string;
} {
    if (status === 'accepted') {
        return {
            label: ' diterima',
            class: 'border-success/30 bg-success/10 text-success',
        };
    }
    if (status === 'rejected') {
        return {
            label: 'Ditolak',
            class: 'border-destructive/25 bg-destructive/10 text-destructive',
        };
    }
    if (status === 'partial') {
        return {
            label: 'Sebagian direview',
            class: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
        };
    }
    return {
        label: 'Menunggu review',
        class: 'border-warning/30 bg-warning/10 text-warning',
    };
}

/** Label untuk role registrasi. */
export function registrationRoleLabel(role: 'leader' | 'member' | null | undefined): string {
    if (role === 'leader') return 'Ketua';
    if (role === 'member') return 'Anggota';
    return '—';
}
