<?php

use Illuminate\Support\Facades\File;

test('project list does not render project descriptions in table rows', function () {
    $source = File::get(resource_path('js/pages/projects/index.tsx'));

    expect($source)
        ->toContain('Nama Project / Sistem')
        ->not->toContain('proj.description');
});
