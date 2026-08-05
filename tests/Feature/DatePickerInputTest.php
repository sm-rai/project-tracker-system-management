<?php

use Illuminate\Support\Facades\File;

test('issue and feature request forms use the shared datetime picker', function () {
    $formPaths = [
        resource_path('js/components/issues/issue-form.tsx'),
        resource_path('js/components/feature-requests/feature-request-form.tsx'),
    ];

    foreach ($formPaths as $formPath) {
        $source = File::get($formPath);

        expect($source)
            ->toContain("import { DateTimePicker } from '@/components/ui/date-time-picker';")
            ->toContain('<DateTimePicker')
            ->not->toContain('datetime-local');
    }
});

test('shared datetime picker uses shadcn date and time controls', function () {
    $source = File::get(resource_path('js/components/ui/date-time-picker.tsx'));

    expect($source)
        ->toContain('@/components/ui/calendar')
        ->toContain('@/components/ui/input')
        ->toContain('type="time"')
        ->toContain('step="60"')
        ->toContain('value={timeValue}')
        ->toContain('yyyy-MM-dd\'T\'HH:mm');
});
