<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSlaConfigRequest;
use App\Models\SlaConfig;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SlaConfigController extends Controller
{
    public function index(): Response
    {
        $priorities = ['urgent' => 1, 'normal' => 3, 'low' => 7];
        foreach ($priorities as $priority => $defaultDays) {
            SlaConfig::firstOrCreate(
                ['priority' => $priority],
                ['target_resolution_days' => $defaultDays]
            );
        }

        $configs = SlaConfig::all()->mapWithKeys(function ($config) {
            $key = $config->priority instanceof \BackedEnum ? $config->priority->value : (string) $config->priority;

            return [$key => $config->target_resolution_days];
        });

        return Inertia::render('sla/index', [
            'configs' => $configs,
        ]);
    }

    public function update(UpdateSlaConfigRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        foreach ($validated['configs'] as $priority => $days) {
            SlaConfig::updateOrCreate(
                ['priority' => $priority],
                ['target_resolution_days' => $days]
            );
        }

        return redirect()->back()->with('success', 'Konfigurasi SLA berhasil diperbarui.');
    }
}
