<?php

namespace App\Http\Controllers;

use App\Enums\BriefFeatureStatus;
use App\Enums\ProjectStatus;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $statusFilter = $request->input('status');

        $query = Project::query()
            ->with(['creator', 'users'])
            ->withCount('briefFeatures')
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($statusFilter, function ($q, $statusFilter) {
                $q->where('status', $statusFilter);
            })
            ->latest();

        $projects = $query->paginate(10)->withQueryString();

        // Append calculated realization percentage for each project
        $projects->getCollection()->transform(function (Project $project) {
            $project->append('realization_percentage');

            return $project;
        });

        // Calculate OKR 1 Average Realization Percentage across active development projects
        $activeDevelopmentStatuses = [
            ProjectStatus::Planning->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::OnHold->value,
            ProjectStatus::CompletedPendingDeployment->value,
        ];

        $activeProjects = Project::whereIn('status', $activeDevelopmentStatuses)->get();
        $totalActive = $activeProjects->count();
        $avgOkr1 = 0;

        if ($totalActive > 0) {
            $sumPercentage = $activeProjects->sum(fn (Project $p) => $p->realization_percentage);
            $avgOkr1 = round($sumPercentage / $totalActive, 1);
        }

        $summary = [
            'total_projects' => Project::count(),
            'in_progress_count' => Project::where('status', ProjectStatus::InProgress->value)->count(),
            'deployed_count' => Project::whereIn('status', [
                ProjectStatus::DeployedRunning->value,
                ProjectStatus::DeployedMaintenance->value,
            ])->count(),
            'okr1_avg_realization' => $avgOkr1,
        ];

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'summary' => $summary,
            'filters' => [
                'search' => $search ?? '',
                'status' => $statusFilter ?? '',
            ],
            'statuses' => collect(ProjectStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create(): Response
    {
        $availableUsers = User::whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('projects/create', [
            'statuses' => collect(ProjectStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'available_users' => $availableUsers,
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $briefFeaturesData = $validated['brief_features'] ?? [];
        $userIds = $validated['user_ids'] ?? [];

        unset($validated['brief_features'], $validated['user_ids']);

        $validated['created_by'] = $request->user()->id;

        $project = DB::transaction(function () use ($validated, $briefFeaturesData, $userIds) {
            $proj = Project::create($validated);

            if (! empty($userIds)) {
                $proj->users()->sync($userIds);
            }

            if (! empty($briefFeaturesData)) {
                foreach ($briefFeaturesData as $feature) {
                    if (! empty($feature['name'])) {
                        $proj->briefFeatures()->create([
                            'name' => $feature['name'],
                            'description' => $feature['description'] ?? null,
                            'status' => $feature['status'] ?? BriefFeatureStatus::Todo->value,
                        ]);
                    }
                }
            }

            return $proj;
        });

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project berhasil dibuat.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project): Response
    {
        $project->load([
            'creator',
            'users',
            'briefFeatures' => fn ($q) => $q->orderBy('id', 'asc'),
            'issues' => fn ($q) => $q->latest('reported_at'),
            'featureRequests' => fn ($q) => $q->latest('requested_at'),
        ]);

        $project->append('realization_percentage');

        // Check if eligible for Issue & Feature Request tab (deployed status)
        $isDeployed = in_array($project->status, [
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ]);

        return Inertia::render('projects/show', [
            'project' => $project,
            'is_deployed' => $isDeployed,
            'brief_feature_statuses' => collect(BriefFeatureStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'project_statuses' => collect(ProjectStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project): Response
    {
        $project->load('users');

        $availableUsers = User::whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('projects/edit', [
            'project' => $project,
            'statuses' => collect(ProjectStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'available_users' => $availableUsers,
            'assigned_user_ids' => $project->users->pluck('id')->toArray(),
        ]);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $validated = $request->validated();
        $userIds = $validated['user_ids'] ?? [];
        unset($validated['user_ids']);

        $newStatus = ProjectStatus::from($validated['status']);
        $deployedStatuses = [
            ProjectStatus::CompletedPendingDeployment,
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ];

        if (in_array($newStatus, $deployedStatuses) && empty($validated['actual_end_date']) && empty($project->actual_end_date)) {
            $validated['actual_end_date'] = now()->toDateString();
        }

        DB::transaction(function () use ($project, $validated, $userIds) {
            $project->update($validated);
            $project->users()->sync($userIds);
        });

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project berhasil diperbarui.');
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project berhasil dihapus.');
    }
}
