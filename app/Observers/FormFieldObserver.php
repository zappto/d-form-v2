<?php

namespace App\Observers;

use App\Models\FormField;
use App\Support\StorageJanitor;

class FormFieldObserver
{
    /** Hapus gambar banner/opsi milik field dari metadata-nya. */
    public function forceDeleted(FormField $field): void
    {
        StorageJanitor::deletePublicMany(StorageJanitor::metadataImagePaths($field->metadata));
    }
}
