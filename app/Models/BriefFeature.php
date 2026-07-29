<?php

namespace App\Models;

use App\Enums\BriefFeatureStatus;
use Database\Factories\BriefFeatureFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property string $name
 * @property string|null $description
 * @property BriefFeatureStatus $status
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class BriefFeature extends Model
{
    /** @use HasFactory<BriefFeatureFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'status',
    ];

    protected $attributes = [
        'status' => 'todo',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => BriefFeatureStatus::class,
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (BriefFeature $briefFeature) {
            if ($briefFeature->isDirty('status')) {
                if ($briefFeature->status === BriefFeatureStatus::Done) {
                    $briefFeature->completed_at = now();
                } else {
                    $original = $briefFeature->getOriginal('status');
                    $wasDone = $original === BriefFeatureStatus::Done
                        || $original === BriefFeatureStatus::Done->value;

                    if ($wasDone) {
                        $briefFeature->completed_at = null;
                    }
                }
            }
        });
    }

    /**
     * The project this brief feature belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
