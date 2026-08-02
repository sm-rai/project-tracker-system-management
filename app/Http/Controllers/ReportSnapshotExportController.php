<?php

namespace App\Http\Controllers;

use App\Actions\Reports\BuildReportExportData;
use App\Actions\Reports\RenderReportSnapshotExport;
use App\Models\ReportSnapshot;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class ReportSnapshotExportController extends Controller
{
    public function __construct(
        private BuildReportExportData $buildReportExportData,
        private RenderReportSnapshotExport $renderReportSnapshotExport,
    ) {}

    public function pdf(ReportSnapshot $reportSnapshot): Response
    {
        try {
            $html = $this->renderTemplate('reports.export.pdf', $reportSnapshot);
            $pdfBase64 = $this->renderReportSnapshotExport->pdf($html);
            $pdf = base64_decode($pdfBase64, true);

            if ($pdf === false) {
                throw new RuntimeException('Browsershot returned invalid PDF data.');
            }

            return response()->streamDownload(
                static function () use ($pdf): void {
                    echo $pdf;
                },
                $this->filename($reportSnapshot, 'pdf'),
                ['Content-Type' => 'application/pdf'],
            );
        } catch (Throwable $exception) {
            $this->handleExportFailure('PDF', $reportSnapshot, $exception);
        }
    }

    public function png(ReportSnapshot $reportSnapshot): BinaryFileResponse
    {
        $temporaryPath = null;

        try {
            $html = $this->renderTemplate('reports.export.png', $reportSnapshot);
            $temporaryPath = $this->temporaryPngPath();

            $this->renderReportSnapshotExport->png($html, $temporaryPath);

            return response()
                ->download(
                    $temporaryPath,
                    $this->filename($reportSnapshot, 'png'),
                    ['Content-Type' => 'image/png'],
                )
                ->deleteFileAfterSend(true);
        } catch (Throwable $exception) {
            if ($temporaryPath !== null && is_file($temporaryPath)) {
                unlink($temporaryPath);
            }

            $this->handleExportFailure('PNG', $reportSnapshot, $exception);
        }
    }

    private function renderTemplate(string $viewName, ReportSnapshot $snapshot): string
    {
        $styles = file_get_contents(resource_path('css/report-export.css'));

        if ($styles === false) {
            throw new RuntimeException('Report export stylesheet could not be read.');
        }

        return view($viewName, [
            'report' => $this->buildReportExportData->handle($snapshot),
            'styles' => $styles,
        ])->render();
    }

    private function temporaryPngPath(): string
    {
        $temporaryFile = tempnam(sys_get_temp_dir(), 'report-snapshot-');

        if ($temporaryFile === false) {
            throw new RuntimeException('Temporary report export file could not be created.');
        }

        unlink($temporaryFile);

        return $temporaryFile.'.png';
    }

    private function filename(ReportSnapshot $snapshot, string $extension): string
    {
        $start = $snapshot->period_start_date;
        $end = $snapshot->period_end_date;
        $months = [
            1 => 'jan',
            2 => 'feb',
            3 => 'mar',
            4 => 'apr',
            5 => 'mei',
            6 => 'jun',
            7 => 'jul',
            8 => 'agu',
            9 => 'sep',
            10 => 'okt',
            11 => 'nov',
            12 => 'des',
        ];

        return sprintf(
            'snapshot-okr-%d-%s-%d-%02d-%s-%d.%s',
            $start->day,
            $months[$start->month],
            $start->year,
            $end->day,
            $months[$end->month],
            $end->year,
            $extension,
        );
    }

    private function handleExportFailure(
        string $format,
        ReportSnapshot $snapshot,
        Throwable $exception,
    ): never {
        Log::error('Report snapshot export failed.', [
            'format' => $format,
            'report_snapshot_id' => $snapshot->id,
            'exception' => $exception,
        ]);

        abort(
            Response::HTTP_SERVICE_UNAVAILABLE,
            "Export {$format} laporan sedang tidak tersedia.",
        );
    }
}
