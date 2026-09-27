<?php

namespace App\Observers;

use App\Models\Recruitment\RecruitmentPeriod;
use App\Support\StorageJanitor;

class RecruitmentPeriodObserver
{
    /**
     * Force-delete applications DULU supaya observer mereka jalan dan FK aman.
     * (forceDeleted sudah terlambat: baris period terhapus duluan.)
     */
    public function forceDeleting(RecruitmentPeriod $period): void
    {
        $period->applications()->get()->each(function ($application): void {
            $application->forceDelete();
        });
    }

    /** Hapus banner period. Soft delete tidak tersentuh. */
    public function forceDeleted(RecruitmentPeriod $period): void
    {
        StorageJanitor::deletePublic($period->banner);
    }
}
