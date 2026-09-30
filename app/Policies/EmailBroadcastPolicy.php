<?php

namespace App\Policies;

use App\Models\EmailBroadcast;
use App\Models\User;
use App\Support\BroadcastPermissions;

class EmailBroadcastPolicy
{
    /**
     * Scope pemilik: baris legacy tanpa created_by tetap boleh diubah pemegang
     * permission; baris ber-pemilik hanya untuk owner-nya; super-admin bebas semua.
     */
    private function isOwnedBy(User $user, EmailBroadcast $broadcast): bool
    {
        if ($user->hasRole('super-admin')) {
            return true;
        }

        if ($broadcast->created_by === null) {
            return true;
        }

        return $broadcast->created_by === $user->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->can(BroadcastPermissions::VIEW);
    }

    public function view(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::VIEW);
    }

    public function create(User $user): bool
    {
        return $user->can(BroadcastPermissions::CREATE);
    }

    public function update(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::CREATE) && $this->isOwnedBy($user, $broadcast);
    }

    public function schedule(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::SCHEDULE) && $this->isOwnedBy($user, $broadcast);
    }

    public function cancel(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::CANCEL) && $this->isOwnedBy($user, $broadcast);
    }

    public function retry(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::RETRY) && $this->isOwnedBy($user, $broadcast);
    }

    public function delete(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::DELETE) && $this->isOwnedBy($user, $broadcast);
    }
}
