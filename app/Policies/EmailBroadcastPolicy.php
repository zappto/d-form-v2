<?php

namespace App\Policies;

use App\Models\EmailBroadcast;
use App\Models\User;
use App\Support\BroadcastPermissions;

class EmailBroadcastPolicy
{
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
        return $user->can(BroadcastPermissions::CREATE) || $user->can(BroadcastPermissions::SCHEDULE);
    }

    public function schedule(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::SCHEDULE);
    }

    public function cancel(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::CANCEL);
    }

    public function retry(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::RETRY);
    }

    public function delete(User $user, EmailBroadcast $broadcast): bool
    {
        return $user->can(BroadcastPermissions::DELETE);
    }
}
