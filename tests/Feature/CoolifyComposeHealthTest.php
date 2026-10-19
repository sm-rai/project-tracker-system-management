<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

test('coolify excludes the queue worker from aggregate health checks', function (): void {
    $source = File::get(base_path('docker-compose.coolify.yaml'));
    $worker = Str::between($source, "\n  worker:\n", "\n  database:\n");

    expect($worker)
        ->toContain('    exclude_from_hc: true')
        ->not->toContain('healthcheck:');
});

test('coolify passes the trusted proxy network to the web application', function (): void {
    $source = File::get(base_path('docker-compose.coolify.yaml'));
    $app = Str::between($source, "\n  app:\n", "\n  worker:\n");

    expect($app)->toContain('TRUSTED_PROXIES: "${TRUSTED_PROXIES:-172.18.0.0/16}"');
});

test('the application trusts HTTPS forwarded by configured proxies', function (): void {
    $middleware = File::get(base_path('bootstrap/app.php'));
    $proxyConfig = File::get(base_path('config/trustedproxy.php'));

    expect($middleware)
        ->toContain('$middleware->trustProxies(')
        ->toContain('Request::HEADER_X_FORWARDED_PROTO');

    expect($proxyConfig)->toContain("'proxies' => env('TRUSTED_PROXIES')");
});

test('production image gives chromium writable runtime directories', function (): void {
    $source = File::get(base_path('Dockerfile'));

    expect($source)
        ->toContain('    HOME=/tmp/.chromium \\')
        ->toContain('    XDG_CONFIG_HOME=/tmp/.chromium/config \\')
        ->toContain('    XDG_CACHE_HOME=/tmp/.chromium/cache \\')
        ->toContain('    && install -d -o www-data -g www-data -m 0700 /tmp/.chromium');
});
