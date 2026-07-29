<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Only admins can view the user list.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Any logged-in user can view another user's profile.
     */
    public function view(User $user, User $model): bool
    {
        return true;
    }

    /**
     * Only admins can create new users.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can update other users.
     */
    public function update(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can delete/deactivate users, but cannot delete themselves.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->id !== $model->id;
    }

    /**
     * Only admins can restore soft-deleted users.
     */
    public function restore(User $user, User $model): bool
    {
        return $user->isAdmin();
    }
}
