<?php

namespace App\Policies;

use App\Models\SlaConfig;
use App\Models\User;

class SlaConfigPolicy
{
    /**
     * Any logged-in user can view SLA configs.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can view a single SLA config.
     */
    public function view(User $user, SlaConfig $slaConfig): bool
    {
        return true;
    }

    /**
     * Only admins can create SLA configs.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can update SLA configs.
     */
    public function update(User $user, SlaConfig $slaConfig): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can delete SLA configs.
     */
    public function delete(User $user, SlaConfig $slaConfig): bool
    {
        return $user->isAdmin();
    }
}
