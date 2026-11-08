<?php

namespace App\Http\Controllers;

use App\Actions\Reports\BuildQuarterlyOkrReportData;
use App\Support\AppDateTime;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuarterlyOkrReportController extends Controller
{
    public function index(Request $request, BuildQuarterlyOkrReportData $buildQuarterlyOkrReportData): Response
    {
        $now = AppDateTime::nowInBusinessTimezone();
        $validated = $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:'.$now->year],
            'quarter' => ['nullable', 'integer', 'between:1,4'],
        ]);
        $year = (int) ($validated['year'] ?? $now->year);
        $quarter = (int) ($validated['quarter'] ?? $now->quarter);

        if ($year === $now->year && $quarter > $now->quarter) {
            abort(404);
        }

        return Inertia::render('okr-reports/index', [
            'report' => $buildQuarterlyOkrReportData->handle($year, $quarter),
            'periodOptions' => $buildQuarterlyOkrReportData->availablePeriods(),
        ]);
    }
}
