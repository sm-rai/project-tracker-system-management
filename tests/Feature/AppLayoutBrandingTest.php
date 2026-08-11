<?php

use Illuminate\Support\Facades\File;

test('app layout uses the branded RAI favicon', function () {
    $source = File::get(resource_path('views/app.blade.php'));

    expect($source)
        ->toContain('<link rel="icon" href="/favicon.ico" type="image/x-icon">')
        ->toContain('<link rel="apple-touch-icon" href="/images/Logo RAI.png">')
        ->not->toContain('href="/favicon.svg"');
});
