<?php

namespace App\Models;

use App\Enums\Priority;
use Database\Factories\SlaConfigFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Priority $priority
 * @property int $target_resolution_days
 * @property Carbon|null $updated_at
 */
class SlaConfig extends Model
{
    /** @use HasFactory<SlaConfigFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'priority',
        'target_resolution_days',
    ];

    /** @var bool */
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'priority' => Priority::class,
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the target resolution days for a given priority.
     */
    public static function daysForPriority(Priority $priority): int
    {
        return static::where('priority', $priority)->value('target_resolution_days') ?? 7;
    }
}
