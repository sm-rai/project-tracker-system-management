<?php

use App\Support\AppDateTime;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('okr:snapshot-closed-quarters')
    ->dailyAt('00:05')
    ->timezone(AppDateTime::businessTimezone())
    ->withoutOverlapping();
