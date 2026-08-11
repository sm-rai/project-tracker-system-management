<?php

use Illuminate\Support\Facades\File;

test('issue index keeps rows compact without rendering descriptions', function () {
    $source = File::get(resource_path('js/pages/issues/index.tsx'));

    expect($source)
        ->toContain('<Table className="min-w-[980px] table-fixed">')
        ->toContain('className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"')
        ->toContain('Issue')
        ->not->toContain('issue.description');
});
