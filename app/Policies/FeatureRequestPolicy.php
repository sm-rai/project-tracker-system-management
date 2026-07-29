<?php

namespace App\Policies;

use App\Models\FeatureRequest;
use App\Models\User;

class FeatureRequestPolicy
{
    /**
     * Any logged-in user can view feature requests.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can view a single feature request.
     */
    public function view(User $user, FeatureRequest $featureRequest): bool
    {
        return true;
    }

    /**
     * Any logged-in user can create feature requests (no assignment requirement).
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can update feature requests (no assignment requirement).
     */
    public function update(User $user, FeatureRequest $featureRequest): bool
    {
        return true;
    }

    /**
     * Only admins can delete feature requests.
     */
    public function delete(User $user, FeatureRequest $featureRequest): bool
    {
        return $user->isAdmin();
    }
}
