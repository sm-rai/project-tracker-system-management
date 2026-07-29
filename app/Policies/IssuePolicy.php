<?php

namespace App\Policies;

use App\Models\Issue;
use App\Models\User;

class IssuePolicy
{
    /**
     * Any logged-in user can view issues.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can view a single issue.
     */
    public function view(User $user, Issue $issue): bool
    {
        return true;
    }

    /**
     * Any logged-in user can create issues (no assignment requirement).
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can update issues (no assignment requirement).
     */
    public function update(User $user, Issue $issue): bool
    {
        return true;
    }

    /**
     * Only admins can delete issues.
     */
    public function delete(User $user, Issue $issue): bool
    {
        return $user->isAdmin();
    }
}
