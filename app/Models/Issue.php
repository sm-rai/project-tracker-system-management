<?php

namespace App\Models;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\RootCauseCategory;
use Database\Factories\IssueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $project_id
 * @property string $title
 * @property string $description
 * @property Priority $priority
 * @property RootCauseCategory $root_cause_category
 * @property Carbon $reported_at
 * @property Carbon $due_date
 * @property Carbon|null $resolved_at
 * @property IssueStatus $status
 * @property string|null $resolution_note
 * @property bool|null $is_on_time
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Project|null $project
 */
class Issue extends Model
{
    /** @use HasFactory<IssueFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'priority',
        'root_cause_category',
        'reported_at',
        'due_date',
        'resolved_at',
        'status',
        'resolution_note',
        'is_on_time',
    ];

    protected $attributes = [
        'status' => 'open',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'priority' => Priority::class,
            'root_cause_category' => RootCauseCategory::class,
            'status' => IssueStatus::class,
            'reported_at' => 'datetime',
            'due_date' => 'datetime',
            'resolved_at' => 'datetime',
            'is_on_time' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Issue $issue) {
            if (! $issue->due_date && $issue->reported_at && $issue->priority) {
                $issue->due_date = Carbon::parse($issue->reported_at)
                    ->addHours(SlaConfig::hoursForPriority($issue->priority));
            }
        });

        static::saving(function (Issue $issue) {
            if (
                ($issue->isDirty('resolved_at') || $issue->isDirty('due_date'))
                && $issue->resolved_at !== null
            ) {
                $dueCarbon = Carbon::parse($issue->due_date ?? $issue->reported_at);
                $issue->is_on_time = Carbon::parse($issue->resolved_at)->lte($dueCarbon);
                $issue->status = IssueStatus::Resolved;
            } elseif ($issue->isDirty('status') && $issue->status === IssueStatus::Open) {
                $issue->resolved_at = null;
                $issue->is_on_time = null;
            }
        });
    }

    /**
     * The project this issue belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
