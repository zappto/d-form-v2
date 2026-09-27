<?php

namespace App\Observers;

use App\Models\FormAnswer;
use App\Support\StorageJanitor;

class FormAnswerObserver
{
    /**
     * Hapus file jawaban (form-uploads/…) milik submission ini.
     * FormAnswer tanpa SoftDeletes: tiap delete adalah hard delete,
     * dan forceDelete() bawaannya hanya memanggil delete() sehingga
     * event forceDeleted tak pernah tembak — hook deleted yang benar.
     */
    public function deleted(FormAnswer $answer): void
    {
        StorageJanitor::deletePublicMany(StorageJanitor::formAnswerPaths($answer->answers));
    }
}
