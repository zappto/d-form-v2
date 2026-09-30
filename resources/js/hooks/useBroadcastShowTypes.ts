/** Tipe bersama halaman detail broadcast; satu sumber kebenaran untuk 7 hook Show. */

/** Lampiran broadcast pada halaman detail; dipakai hook attachment dan daftar Show. */
export interface IBroadcastShowAttachment {
    id: string;
    file_name: string;
    mime_type: string | null;
    file_size: number;
}

/** Dataset snapshot broadcast (sumber + rujukan opsional); cerminkan payload backend. */
export interface IBroadcastShowDataset {
    type: string;
    id?: string | null;
    event_id?: string | null;
    period_id?: string | null;
}

/** Broadcast pada halaman detail; dipakai ringkasan status dan inisialisasi form. */
export interface IBroadcastShowBroadcast {
    id: string;
    name: string;
    status: string;
    scheduled_at: string | null;
    schedule_date: string | null;
    schedule_time: string | null;
    delay_min: number;
    delay_max: number;
    event_id: string | null;
    event_title: string | null;
    subject: string | null;
    content: string | null;
    datasets: IBroadcastShowDataset[];
    total_recipients: number;
    total_sent: number;
    total_failed: number;
    sent_count: number;
    failed_count: number;
    pending_count: number;
    processing_count: number;
    cancelled_count: number;
    recipients_count: number;
    attachments: IBroadcastShowAttachment[];
}

/** Baris recipient snapshot; dipakai tabel recipients Show. */
export interface IBroadcastShowRecipientRow {
    id: string;
    name: string | null;
    email: string;
    status: string;
    attempts: number;
    sent_at: string | null;
    error_message: string | null;
}

/** Opsi event untuk konteks email broadcast. */
export interface IBroadcastShowEventOption {
    id: string;
    title: string;
}

/** Halaman recipients partial (Inertia only); dipakai prop Show. */
export interface IBroadcastShowRecipientsPage {
    data: IBroadcastShowRecipientRow[];
    current_page: number;
    last_page: number;
    total: number;
}

/** Ringkasan dedup snapshot; dipakai banner peringatan Show. */
export interface IBroadcastShowDuplicateSummary {
    total: number;
    unique: number;
    duplicates: number;
    duplicate_emails: string[];
}

/** Pratinjau render email; dipakai kartu preview Show. */
export interface IBroadcastShowPreview {
    from: string;
    subject: string;
    content: string;
    sample_name: string;
    event_name: string;
    attachments: string[];
}

/** Entri manual snapshot (nama opsional + email); dipakai form snapshot. */
export interface IBroadcastSnapshotManualEntry {
    name: string | null;
    email: string;
}
