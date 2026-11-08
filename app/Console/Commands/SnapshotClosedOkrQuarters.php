<?php

namespace App\Console\Commands;

use App\Actions\Reports\CaptureClosedOkrQuarterSnapshots;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('okr:snapshot-closed-quarters')]
#[Description('Capture snapshots for closed quarterly OKR reports')]
class SnapshotClosedOkrQuarters extends Command
{
    public function handle(CaptureClosedOkrQuarterSnapshots $captureClosedOkrQuarterSnapshots): int
    {
        $createdCount = $captureClosedOkrQuarterSnapshots->handle();

        $this->info(sprintf('%d snapshot kuartal OKR baru dibuat.', $createdCount));

        return self::SUCCESS;
    }
}
