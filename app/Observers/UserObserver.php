<?php

namespace App\Observers;

use App\Models\User;
use App\Support\StorageJanitor;

class UserObserver
{
    /**
     * Hapus avatar tersimpan. URL OAuth dilewati guard helper.
     * Soft delete tidak tersentuh.
     */
    public function forceDeleted(User $user): void
    {
        StorageJanitor::deletePublic($user->avatar);
    }
}
