<?php

namespace App\Models;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use Database\Factories\FeatureRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property string $title
 * @property string $description
 * @property Priority $priority
 * @property Carbon $requested_at
 * @property Carbon $due_date
 * @property Carbon|null $fulfilled_at
 * @property FeatureRequestStatus $status
 * @property bool|null $is_on_time
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class FeatureRequest extends Model
{
    /** @use HasFactory<FeatureRequestFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'priority',
        'requested_at',
        'fulfilled_at',
        'status',
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
            'status' => FeatureRequestStatus::class,
            'requested_at' => 'datetime',
            'due_date' => 'date',
            'fulfilled_at' => 'datetime',
            'is_on_time' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (FeatureRequest $featureRequest) {
            $featureRequest->due_date = Carbon::parse($featureRequest->requested_at)
                ->addDays(SlaConfig::daysForPriority($featureRequest->priority));
        });

        static::saving(function (FeatureRequest $featureRequest) {
            if ($featureRequest->isDirty('fulfilled_at') && $featureRequest->fulfilled_at !== null) {
                $featureRequest->is_on_time = $featureRequest->fulfilled_at->lte($featureRequest->due_date->endOfDay());
                $featureRequest->status = FeatureRequestStatus::Fulfilled;
            }
        });
    }

    /**
     * The project this feature request belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
