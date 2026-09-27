<?php

namespace App\Observers;

use App\Models\Recruitment\RecruitmentApplication;
use App\Support\StorageJanitor;

class RecruitmentApplicationObserver
{
    /**
     * Hapus dokumen (CV/portofolio/bukti-follow, disk local) milik application.
     * Hook deleting (bukan deleted): FK rec_docs_app_fk memakai cascadeOnDelete
     * sehingga baris dokumen ikut hilang dalam query yang sama dan relasi
     * sudah null saat deleted. Application tanpa SoftDeletes: tiap delete
     * adalah hard delete; forceDelete() bawaan hanya memanggil delete().
     */
    public function deleting(RecruitmentApplication $application): void
    {
        $document = $application->document;
        if ($document === null) {
            return;
        }
        StorageJanitor::deleteLocal($document->cv_path);
        StorageJanitor::deleteLocal($document->portfolio_path);
        StorageJanitor::deleteLocal($document->instagram_follow_path);
    }
}
