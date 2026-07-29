<?php

namespace App\Policies;

use App\Models\BriefFeature;
use App\Models\User;

class BriefFeaturePolicy
{
    /**
     * Any logged-in user can view brief features.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can view a single brief feature.
     */
    public function view(User $user, BriefFeature $briefFeature): bool
    {
        return true;
    }

    /**
     * Admin or user assigned to the parent project can create brief features.
     */
    public function create(User $user): bool
    {
        // Project-level check is done at controller level with the project context.
        return true;
    }

    /**
     * Admin or user assigned to the parent project can update brief features.
     */
    public function update(User $user, BriefFeature $briefFeature): bool
    {
        return $user->isAdmin() || $briefFeature->project->isAssignedTo($user);
    }

    /**
     * Admin or user assigned to the parent project can delete brief features.
     */
    public function delete(User $user, BriefFeature $briefFeature): bool
    {
        return $user->isAdmin() || $briefFeature->project->isAssignedTo($user);
    }
}
