<?php

use Illuminate\Support\Facades\File;

test('feature request pages use the standard sidebar shell dimensions', function () {
    $pagePaths = [
        resource_path('js/pages/feature-requests/create.tsx'),
        resource_path('js/pages/feature-requests/edit.tsx'),
    ];

    foreach ($pagePaths as $pagePath) {
        $source = File::get($pagePath);

        expect($source)
            ->toContain("'--sidebar-width': 'calc(var(--spacing) * 72)'")
            ->toContain("'--header-height': 'calc(var(--spacing) * 12)'")
            ->toContain('<SiteHeader title="Feature Request" />');
    }
});

test('feature request form follows the shared operational form spacing', function () {
    $source = File::get(
        resource_path('js/components/feature-requests/feature-request-form.tsx'),
    );

    expect($source)
        ->toContain(
            'className="@container flex flex-1 flex-col gap-5 p-4 md:p-6"',
        )
        ->toContain('className="size-11 shrink-0 md:size-9"')
        ->toContain(
            'className="text-2xl font-bold tracking-tight text-foreground"',
        )
        ->toContain(
            'className="mt-0.5 max-w-3xl text-sm leading-relaxed text-muted-foreground"',
        )
        ->toContain(
            'className="grid w-full gap-5 xl:grid-cols-12 xl:items-start"',
        )
        ->toContain(
            'className="border-b border-border px-5 py-5 md:px-6"',
        )
        ->toContain(
            'className="grid gap-5 px-5 py-5 md:px-6 md:py-6"',
        );
});

test('feature request fulfillment dialog captures a completion datetime', function () {
    $source = File::get(resource_path('js/pages/feature-requests/show.tsx'));

    expect($source)
        ->toContain('fulfilled_at: localDateTime()')
        ->toContain("import { DateTimePicker } from '@/components/ui/date-time-picker';")
        ->toContain("fulfillForm.setData('fulfilled_at', value)")
        ->toContain('id="fulfilled_at"');
});
