<?php

use App\Support\AppDateTime;
use Tests\TestCase;

uses(TestCase::class);

test('parses user datetime input in the business timezone and normalizes it to utc', function () {
    expect(AppDateTime::fromUserInput('2026-08-07T16:00')->toIso8601String())
        ->toBe('2026-08-07T09:00:00+00:00');
});

test('converts business date boundaries to utc', function () {
    expect(AppDateTime::startOfBusinessDate('2026-08-07')->toIso8601String())
        ->toBe('2026-08-06T17:00:00+00:00')
        ->and(AppDateTime::endOfBusinessDate('2026-08-07')->toIso8601String())
        ->toBe('2026-08-07T16:59:59+00:00');
});
