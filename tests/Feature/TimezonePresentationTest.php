<?php

use Illuminate\Support\Facades\File;

test('frontend date formatting uses the configured business timezone', function () {
    $source = File::get(resource_path('js/lib/datetime.ts'));

    expect($source)
        ->toContain("export const BUSINESS_TIMEZONE = 'Asia/Jakarta';")
        ->toContain('timeZone: BUSINESS_TIMEZONE')
        ->toContain('formatAppDateTimeInput');
});

test('issue and feature request datetime forms use business wall time input', function () {
    $formPaths = [
        resource_path('js/pages/issues/create.tsx'),
        resource_path('js/pages/issues/edit.tsx'),
        resource_path('js/pages/feature-requests/create.tsx'),
        resource_path('js/pages/feature-requests/edit.tsx'),
        resource_path('js/pages/issues/show.tsx'),
        resource_path('js/pages/feature-requests/show.tsx'),
    ];

    foreach ($formPaths as $formPath) {
        $source = File::get($formPath);

        expect($source)
            ->toContain("from '@/lib/datetime'")
            ->not->toContain('toISOString().slice(0, 16)');
    }
});
