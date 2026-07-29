<?php

namespace App\Http\Controllers;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Enums\RootCauseCategory;
use App\Http\Requests\SaveIssueRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IssueController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Issue::with('project')->latest('reported_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($projectId = $request->input('project_id')) {
            if ($projectId === 'unattached') {
                $query->whereNull('project_id');
            } else {
                $query->where('project_id', $projectId);
            }
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($rootCause = $request->input('root_cause_category')) {
            $query->where('root_cause_category', $rootCause);
        }

        if ($request->boolean('overdue')) {
            $query->where('status', IssueStatus::Open)
                ->whereDate('due_date', '<', now());
        }

        $issues = $query->paginate(10)->withQueryString();

        // Metrics calculations for header
        $totalIssues = Issue::count();
        $openIssues = Issue::where('status', IssueStatus::Open)->count();
        $resolvedIssues = Issue::where('status', IssueStatus::Resolved)->count();
        $overdueIssues = Issue::where('status', IssueStatus::Open)
            ->whereDate('due_date', '<', now())
            ->count();

        $resolvedTotal = Issue::where('status', IssueStatus::Resolved)->count();
        $onTimeCount = Issue::where('status', IssueStatus::Resolved)
            ->where('is_on_time', true)
            ->count();

        $onTimePercentage = $resolvedTotal > 0
            ? round(($onTimeCount / $resolvedTotal) * 100, 1)
            : 100.0;

        $deployedProjects = Project::whereIn('status', [
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ])->select('id', 'name', 'status')->get();

        return Inertia::render('issues/index', [
            'issues' => $issues,
            'metrics' => [
                'total' => $totalIssues,
                'open' => $openIssues,
                'resolved' => $resolvedIssues,
                'overdue' => $overdueIssues,
                'on_time_percentage' => $onTimePercentage,
            ],
            'filters' => $request->only(['search', 'project_id', 'priority', 'status', 'root_cause_category', 'overdue']),
            'deployedProjects' => $deployedProjects,
        ]);
    }

    public function create(): Response
    {
        $deployedProjects = Project::whereIn('status', [
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ])->select('id', 'name', 'status')->get();

        $priorities = array_column(Priority::cases(), 'value');
        $rootCauses = array_column(RootCauseCategory::cases(), 'value');

        $slaConfigs = SlaConfig::all()->mapWithKeys(function ($config) {
            $key = $config->priority instanceof \BackedEnum ? $config->priority->value : (string) $config->priority;

            return [$key => $config->target_resolution_days];
        });

        return Inertia::render('issues/create', [
            'deployedProjects' => $deployedProjects,
            'priorities' => $priorities,
            'rootCauses' => $rootCauses,
            'slaConfigs' => $slaConfigs,
        ]);
    }

    public function store(SaveIssueRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $reportedAt = Carbon::parse($validated['reported_at']);
        $priorityEnum = Priority::from($validated['priority']);
        $targetDays = SlaConfig::daysForPriority($priorityEnum);

        $dueDate = $reportedAt->copy()->addDays($targetDays)->toDateString();

        Issue::create([
            'project_id' => $validated['project_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'root_cause_category' => $validated['root_cause_category'],
            'reported_at' => $reportedAt,
            'due_date' => $dueDate,
            'status' => IssueStatus::Open,
        ]);

        return redirect()->route('issues.index')->with('success', 'Issue berhasil ditambahkan.');
    }

    public function show(Issue $issue): Response
    {
        $issue->load('project');

        return Inertia::render('issues/show', [
            'issue' => $issue,
        ]);
    }

    public function edit(Issue $issue): Response
    {
        $deployedProjects = Project::whereIn('status', [
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ])->select('id', 'name', 'status')->get();

        $priorities = array_column(Priority::cases(), 'value');
        $rootCauses = array_column(RootCauseCategory::cases(), 'value');

        $slaConfigs = SlaConfig::all()->mapWithKeys(function ($config) {
            $key = $config->priority instanceof \BackedEnum ? $config->priority->value : (string) $config->priority;

            return [$key => $config->target_resolution_days];
        });

        return Inertia::render('issues/edit', [
            'issue' => $issue->load('project'),
            'deployedProjects' => $deployedProjects,
            'priorities' => $priorities,
            'rootCauses' => $rootCauses,
            'slaConfigs' => $slaConfigs,
        ]);
    }

    public function update(SaveIssueRequest $request, Issue $issue): RedirectResponse
    {
        $validated = $request->validated();

        $reportedAt = Carbon::parse($validated['reported_at']);
        $priorityEnum = Priority::from($validated['priority']);
        $targetDays = SlaConfig::daysForPriority($priorityEnum);

        $dueDate = $reportedAt->copy()->addDays($targetDays)->toDateString();

        $issue->update([
            'project_id' => $validated['project_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'root_cause_category' => $validated['root_cause_category'],
            'reported_at' => $reportedAt,
            'due_date' => $dueDate,
        ]);

        return redirect()->route('issues.index')->with('success', 'Issue berhasil diperbarui.');
    }

    public function resolve(Request $request, Issue $issue): RedirectResponse
    {
        $validated = $request->validate([
            'resolution_note' => 'nullable|string',
        ]);

        $issue->resolved_at = now();
        $issue->resolution_note = $validated['resolution_note'] ?? null;
        $issue->save();

        return redirect()->back()->with('success', 'Issue berhasil ditandai selesai.');
    }

    public function reopen(Issue $issue): RedirectResponse
    {
        $issue->status = IssueStatus::Open;
        $issue->resolved_at = null;
        $issue->is_on_time = null;
        $issue->save();

        return redirect()->back()->with('success', 'Issue berhasil dibuka kembali.');
    }

    public function destroy(Issue $issue): RedirectResponse
    {
        $issue->delete();

        return redirect()->route('issues.index')->with('success', 'Issue berhasil dihapus.');
    }
}
