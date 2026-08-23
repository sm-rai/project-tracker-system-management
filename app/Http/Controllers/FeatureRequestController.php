<?php

namespace App\Http\Controllers;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Http\Requests\SaveFeatureRequestRequest;
use App\Models\FeatureRequest;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Support\AppDateTime;
use Closure;
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

        $fulfilledStatus = FeatureRequestStatus::Fulfilled->value;
        $currentTime = now();
        $approachingTargetEnd = $currentTime->copy()->addDay();
        $summaryRow = FeatureRequest::query()
            ->toBase()
            ->selectRaw('count(case when status != ? then 1 end) as active', [$fulfilledStatus])
            ->selectRaw(
                'count(case when status != ? and due_date >= ? and due_date <= ? then 1 end) as approaching_target',
                [$fulfilledStatus, $currentTime, $approachingTargetEnd],
            )
            ->selectRaw(
                'count(case when status != ? and due_date < ? then 1 end) as overdue',
                [$fulfilledStatus, $currentTime],
            )
            ->first();

        $query = FeatureRequest::query()
            ->select([
                'id',
                'project_id',
                'title',
                'description',
                'priority',
                'requested_at',
                'due_date',
                'fulfilled_at',
                'fulfillment_note',
                'status',
                'is_on_time',
            ])
            ->with('project:id,name,status')
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
                ->where('due_date', '<', $currentTime))
            ->orderByRaw('case when status = ? then 1 else 0 end', [$fulfilledStatus])
            ->orderByRaw('case when status != ? then due_date end asc', [$fulfilledStatus])
            ->latest('requested_at');

        return Inertia::render('feature-requests/index', [
            'featureRequests' => $query->paginate(10)->withQueryString(),
            'summary' => [
                'active' => (int) ($summaryRow->active ?? 0),
                'approaching_target' => (int) ($summaryRow->approaching_target ?? 0),
                'overdue' => (int) ($summaryRow->overdue ?? 0),
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
        $validated = $request->validated();
        $validated['requested_at'] = AppDateTime::fromUserInput($validated['requested_at']);

        $featureRequest = FeatureRequest::create($validated);

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
        $requestedAt = AppDateTime::fromUserInput($validated['requested_at']);
        $validated['requested_at'] = $requestedAt;
        $validated['due_date'] = $requestedAt
            ->addHours(SlaConfig::hoursForPriority(Priority::from($validated['priority'])));
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

        $validated = $request->validate([
            'fulfilled_at' => [
                'nullable',
                'date',
                function (string $attribute, mixed $value, Closure $fail): void {
                    try {
                        $fulfilledAt = AppDateTime::fromUserInput((string) $value);
                    } catch (\Throwable) {
                        return;
                    }

                    if ($fulfilledAt->gt(now())) {
                        $fail('Waktu pemenuhan tidak boleh di masa depan.');
                    }
                },
            ],
            'fulfillment_note' => ['nullable', 'string'],
        ], [
            'fulfilled_at.date' => 'Waktu pemenuhan tidak valid.',
            'fulfilled_at.before_or_equal' => 'Waktu pemenuhan tidak boleh di masa depan.',
        ]);

        $fulfilledAt = isset($validated['fulfilled_at'])
            ? AppDateTime::fromUserInput($validated['fulfilled_at'])->toDateTimeString()
            : null;

        $featureRequest->fulfill(
            $validated['fulfillment_note'] ?? null,
            $fulfilledAt,
        );

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
                $config->priority->value => $config->target_resolution_hours,
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
