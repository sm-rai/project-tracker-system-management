<?php

namespace App\Actions\Reports;

use Spatie\Browsershot\Browsershot;

class RenderReportSnapshotExport
{
    public function pdf(string $html): string
    {
        return $this->browsershot($html)
            ->format('A4')
            ->showBackground()
            ->margins(12, 12, 12, 12)
            ->base64pdf();
    }

    public function png(string $html, string $path): void
    {
        $this->browsershot($html)
            ->windowSize(1600, 900)
            ->deviceScaleFactor(1)
            ->fullPage()
            ->save($path);
    }

    private function browsershot(string $html): Browsershot
    {
        $browsershot = Browsershot::html($html);
        $chromePath = config('services.browsershot.chrome_path');
        $nodeBinary = config('services.browsershot.node_binary');
        $npmBinary = config('services.browsershot.npm_binary');

        if (is_string($chromePath) && $chromePath !== '') {
            $browsershot->setChromePath($chromePath);
        }

        if (is_string($nodeBinary) && $nodeBinary !== '') {
            $browsershot->setNodeBinary($nodeBinary);
        }

        if (is_string($npmBinary) && $npmBinary !== '') {
            $browsershot->setNpmBinary($npmBinary);
        }

        return $browsershot;
    }
}
