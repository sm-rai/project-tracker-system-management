<?php

namespace App\Http\Controllers;

use App\Models\SlaConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.urgent' => 'required|integer|min:1|max:365',
            'configs.normal' => 'required|integer|min:1|max:365',
            'configs.low' => 'required|integer|min:1|max:365',
        ]);

        foreach ($validated['configs'] as $priority => $days) {
            SlaConfig::updateOrCreate(
                ['priority' => $priority],
                ['target_resolution_days' => $days]
            );
        }

        return redirect()->back()->with('success', 'Konfigurasi SLA berhasil diperbarui.');
    }
}
