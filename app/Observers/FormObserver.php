<?php

namespace App\Observers;

use App\Models\Form;
use App\Support\StorageJanitor;

class FormObserver
{
    /**
     * Force-delete fields + answers DULU supaya observer mereka jalan dan FK aman.
     * (forceDeleted sudah terlambat: baris form terhapus duluan.)
     */
    public function forceDeleting(Form $form): void
    {
        $form->formFields()->withTrashed()->get()->each(function ($field): void {
            $field->forceDelete();
        });
        $form->formAnswers()->get()->each(function ($answer): void {
            $answer->forceDelete();
        });
    }

    /**
     * Hapus file milik form (banner_url + gambar di metadata).
     * Soft delete tidak tersentuh (restore tetap utuh).
     */
    public function forceDeleted(Form $form): void
    {
        StorageJanitor::deletePublicMany([
            $form->banner_url,
            ...StorageJanitor::metadataImagePaths($form->metadata),
        ]);
    }
}
