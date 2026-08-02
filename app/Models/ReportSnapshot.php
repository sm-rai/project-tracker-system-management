<?php

namespace App\Models;

use Database\Factories\ReportSnapshotFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Carbon $period_start_date
 * @property Carbon $period_end_date
 * @property string $period_type
 * @property string $okr1_avg_percentage
 * @property string|null $okr1_project_achievement_percentage
 * @property string $okr2_issue_percentage
 * @property string $okr2_feature_request_percentage
 * @property array<string, mixed> $project_breakdown_json
 * @property array<string, mixed> $issue_breakdown_json
 * @property array<string, mixed> $feature_request_breakdown_json
 * @property string|null $pdf_file_path
 * @property array<int, string>|null $png_file_paths
 * @property Carbon $generated_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class ReportSnapshot extends Model
{
    public const PeriodWeeklyDefault = 'weekly_default';

    public const PeriodCustomRange = 'custom_range';

    /** @use HasFactory<ReportSnapshotFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'period_start_date',
        'period_end_date',
        'period_type',
        'okr1_avg_percentage',
        'okr1_project_achievement_percentage',
        'okr2_issue_percentage',
        'okr2_feature_request_percentage',
        'project_breakdown_json',
        'issue_breakdown_json',
        'feature_request_breakdown_json',
        'pdf_file_path',
        'png_file_paths',
        'generated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start_date' => 'date',
            'period_end_date' => 'date',
            'okr1_avg_percentage' => 'decimal:2',
            'okr1_project_achievement_percentage' => 'decimal:2',
            'okr2_issue_percentage' => 'decimal:2',
            'okr2_feature_request_percentage' => 'decimal:2',
            'project_breakdown_json' => 'array',
            'issue_breakdown_json' => 'array',
            'feature_request_breakdown_json' => 'array',
            'png_file_paths' => 'array',
            'generated_at' => 'datetime',
        ];
    }
}
