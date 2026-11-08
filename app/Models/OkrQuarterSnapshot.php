<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $year
 * @property int $quarter
 * @property Carbon $period_start_date
 * @property Carbon $period_end_date
 * @property array<string, mixed> $report_data
 * @property Carbon $generated_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class OkrQuarterSnapshot extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'year',
        'quarter',
        'period_start_date',
        'period_end_date',
        'report_data',
        'generated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'quarter' => 'integer',
            'period_start_date' => 'date',
            'period_end_date' => 'date',
            'report_data' => 'array',
            'generated_at' => 'datetime',
        ];
    }
}
