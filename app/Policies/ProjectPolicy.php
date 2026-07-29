<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Any logged-in user can view projects.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Any logged-in user can view a single project.
     */
    public function view(User $user, Project $project): bool
    {
        return true;
    }

    /**
     * Only admins can create projects.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Admin or assigned user can update project details (name/description).
     */
    public function update(User $user, Project $project): bool
    {
        return $user->isAdmin() || $project->isAssignedTo($user);
    }

    /**
     * Only admins can delete projects.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can change the project's lifecycle status.
     */
    public function updateStatus(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can assign/unassign users to/from a project.
     */
    public function manageAssignment(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }
}
