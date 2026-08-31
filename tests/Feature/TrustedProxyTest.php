<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

test('requests forwarded by the Coolify proxy are treated as secure', function () {
    config()->set('trustedproxy.proxies', '172.18.0.0/16');

    Route::get('/proxy-scheme', fn (Request $request): string => $request->getScheme());

    $this->withServerVariables([
        'REMOTE_ADDR' => '172.18.0.10',
        'HTTP_X_FORWARDED_PROTO' => 'https',
    ])->get('/proxy-scheme')
        ->assertOk()
        ->assertSeeText('https');
});
