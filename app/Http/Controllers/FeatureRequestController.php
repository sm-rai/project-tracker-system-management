<?php

namespace App\Http\Controllers;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Http\Requests\SaveFeatureRequestRequest;
use App\Models\FeatureRequest;
use App\Models\Project;
use App\Models\SlaConfig;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FeatureRequestController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', FeatureRequest::class);

        $query = FeatureRequest::query()
            ->with('project:id,name,status')
            ->latest('requested_at')
            ->when($request->input('search'), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->input('project_id'), fn ($query, $projectId) => $query->where('project_id', $projectId))
            ->when($request->input('priority'), fn ($query, $priority) => $query->where('priority', $priority))
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->boolean('overdue'), fn ($query) => $query
                ->where('status', '!=', FeatureRequestStatus::Fulfilled->value)
                ->whereDate('due_date', '<', now()->toDateString()));

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = Carbon::now()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        $periodQuery = FeatureRequest::query()->whereBetween('requested_at', [$weekStart, $weekEnd]);
        $periodTotal = (clone $periodQuery)->count();
        $periodOnTime = (clone $periodQuery)->where('is_on_time', true)->count();
        $percentage = $periodTotal === 0 ? 100.0 : round(($periodOnTime / $periodTotal) * 100, 1);

        return Inertia::render('feature-requests/index', [
            'featureRequests' => $query->paginate(10)->withQueryString(),
            'metrics' => [
                'total' => FeatureRequest::count(),
                'open' => FeatureRequest::where('status', FeatureRequestStatus::Open->value)->count(),
                'in_progress' => FeatureRequest::where('status', FeatureRequestStatus::InProgress->value)->count(),
                'fulfilled' => FeatureRequest::where('status', FeatureRequestStatus::Fulfilled->value)->count(),
                'overdue' => FeatureRequest::where('status', '!=', FeatureRequestStatus::Fulfilled->value)
                    ->whereDate('due_date', '<', now()->toDateString())->count(),
            ],
            'okr' => [
                'percentage' => $percentage,
                'target' => 90,
                'achieved' => $percentage >= 90,
                'total' => $periodTotal,
                'on_time' => $periodOnTime,
                'period_start' => $weekStart->toDateString(),
                'period_end' => $weekEnd->toDateString(),
            ],
            'filters' => $request->only(['search', 'project_id', 'priority', 'status', 'overdue']),
            'deployedProjects' => $this->deployedProjects(),
            'priorities' => array_column(Priority::cases(), 'value'),
            'statuses' => array_column(FeatureRequestStatus::cases(), 'value'),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', FeatureRequest::class);
        $options = $this->formOptions();
        $requestedProjectId = $request->integer('project_id');
        $options['initialProjectId'] = $options['deployedProjects']->contains('id', $requestedProjectId)
            ? $requestedProjectId
            : null;

        return Inertia::render('feature-requests/create', $options);
    }

    public function store(SaveFeatureRequestRequest $request): RedirectResponse
    {
        $featureRequest = FeatureRequest::create($request->validated());

        return redirect()->route('feature-requests.show', $featureRequest)
            ->with('success', 'Feature request berhasil dicatat.');
    }

    public function show(FeatureRequest $featureRequest): Response
    {
        Gate::authorize('view', $featureRequest);

        return Inertia::render('feature-requests/show', [
            'featureRequest' => $featureRequest->load('project:id,name,status'),
            'can' => ['delete' => request()->user()?->can('delete', $featureRequest) ?? false],
        ]);
    }

    public function edit(FeatureRequest $featureRequest): Response
    {
        Gate::authorize('update', $featureRequest);

        return Inertia::render('feature-requests/edit', [
            'featureRequest' => $featureRequest->load('project:id,name,status'),
            ...$this->formOptions(),
        ]);
    }

    public function update(SaveFeatureRequestRequest $request, FeatureRequest $featureRequest): RedirectResponse
    {
        $validated = $request->validated();
        $validated['due_date'] = Carbon::parse($validated['requested_at'])
            ->addDays(SlaConfig::daysForPriority(Priority::from($validated['priority'])))
            ->toDateString();
        $featureRequest->forceFill($validated)->save();

        return redirect()->route('feature-requests.show', $featureRequest)
            ->with('success', 'Feature request berhasil diperbarui.');
    }

    public function destroy(FeatureRequest $featureRequest): RedirectResponse
    {
        Gate::authorize('delete', $featureRequest);
        $featureRequest->delete();

        return redirect()->route('feature-requests.index')
            ->with('success', 'Feature request berhasil dihapus.');
    }

    public function start(FeatureRequest $featureRequest): RedirectResponse
    {
        Gate::authorize('update', $featureRequest);

        if ($featureRequest->status !== FeatureRequestStatus::Open) {
            throw ValidationException::withMessages(['status' => 'Hanya feature request open yang dapat mulai dikerjakan.']);
        }

        $featureRequest->markInProgress();

        return back()->with('success', 'Feature request mulai dikerjakan.');
    }

    public function fulfill(Request $request, FeatureRequest $featureRequest): RedirectResponse
    {
        Gate::authorize('update', $featureRequest);

        if ($featureRequest->status === FeatureRequestStatus::Fulfilled) {
            throw ValidationException::withMessages(['status' => 'Feature request ini sudah terpenuhi.']);
        }

        $validated = $request->validate(['fulfillment_note' => ['nullable', 'string']]);
        $featureRequest->fulfill($validated['fulfillment_note'] ?? null);

        return back()->with('success', 'Feature request berhasil ditandai terpenuhi.');
    }

    public function reopen(FeatureRequest $featureRequest): RedirectResponse
    {
        Gate::authorize('update', $featureRequest);

        if ($featureRequest->status !== FeatureRequestStatus::Fulfilled) {
            throw ValidationException::withMessages(['status' => 'Hanya feature request fulfilled yang dapat dibuka kembali.']);
        }

        $featureRequest->reopen();

        return back()->with('success', 'Feature request dibuka kembali.');
    }

    /** @return array<string, mixed> */
    private function formOptions(): array
    {
        return [
            'deployedProjects' => $this->deployedProjects(),
            'priorities' => array_column(Priority::cases(), 'value'),
            'slaConfigs' => SlaConfig::all()->mapWithKeys(fn (SlaConfig $config) => [
                $config->priority->value => $config->target_resolution_days,
            ]),
        ];
    }

    /** @return Collection<int, Project> */
    private function deployedProjects(): Collection
    {
        return Project::query()
            ->whereIn('status', [
                ProjectStatus::DeployedRunning->value,
                ProjectStatus::DeployedMaintenance->value,
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'status']);
    }
}
