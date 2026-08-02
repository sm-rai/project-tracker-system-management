<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property ProjectStatus $status
 * @property Carbon|null $start_date
 * @property Carbon|null $target_end_date
 * @property Carbon|null $actual_end_date
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read float $realization_percentage
 * @property-read int $brief_features_total
 * @property-read int $brief_features_done
 * @property-read User $creator
 */
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'name',
        'description',
        'status',
        'start_date',
        'target_end_date',
        'actual_end_date',
        'created_by',
    ];

    protected $attributes = [
        'status' => 'planning',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'start_date' => 'date',
            'target_end_date' => 'date',
            'actual_end_date' => 'date',
        ];
    }

    /**
     * The admin who created this project.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The users assigned to this project.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /**
     * The brief features belonging to this project.
     */
    public function briefFeatures(): HasMany
    {
        return $this->hasMany(BriefFeature::class);
    }

    /**
     * The issues reported for this project.
     */
    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class);
    }

    /**
     * The feature requests for this project.
     */
    public function featureRequests(): HasMany
    {
        return $this->hasMany(FeatureRequest::class);
    }

    /**
     * Check if a user is assigned to this project.
     */
    public function isAssignedTo(User $user): bool
    {
        return $this->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Percentage of brief features that are done (0–100).
     *
     * @return Attribute<float, never>
     */
    protected function realizationPercentage(): Attribute
    {
        return Attribute::get(function (): float {
            $total = $this->briefFeatures()->count();

            if ($total === 0) {
                return 0;
            }

            $done = $this->briefFeatures()->where('status', 'done')->count();

            return round(($done / $total) * 100, 2);
        });
    }
}
