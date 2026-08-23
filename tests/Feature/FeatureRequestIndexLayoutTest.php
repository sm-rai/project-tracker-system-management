<?php

use Illuminate\Support\Facades\File;

test('feature request index presents a compact operational queue', function () {
    $source = File::get(resource_path('js/pages/feature-requests/index.tsx'));

    expect($source)
        ->toContain('summary.approaching_target')
        ->toContain('<Table className="min-w-[720px] table-fixed">')
        ->toMatch('/request\.project\s*\.name/s')
        ->not->toContain('request.description')
        ->not->toContain('Lihat Detail');
});
