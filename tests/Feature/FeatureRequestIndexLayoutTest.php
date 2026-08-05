<?php

use Illuminate\Support\Facades\File;

test('feature request index keeps long descriptions within a bounded table cell', function () {
    $source = File::get(resource_path('js/pages/feature-requests/index.tsx'));

    expect($source)
        ->toContain('<Table className="min-w-[980px] table-fixed">')
        ->toContain('className="whitespace-normal"')
        ->toContain('className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"');
});
