<?php

use App\Models\SlaConfig;
use App\Models\User;

test('authenticated user can view sla configuration page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('sla.index'));

    $response->assertOk();
});

test('user can update target resolution hours for sla priorities', function () {
    $user = User::factory()->create();

    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_hours' => 24]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_hours' => 72]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_hours' => 168]);

    $response = $this->actingAs($user)->put(route('sla.update'), [
        'configs' => [
            'urgent' => 48,
            'normal' => 96,
            'low' => 240,
        ],
    ]);

    $response
        ->assertRedirect()
        ->assertSessionHas('success', 'Konfigurasi SLA berhasil diperbarui.');
    expect(SlaConfig::where('priority', 'urgent')->first()->target_resolution_hours)->toBe(48);
    expect(SlaConfig::where('priority', 'normal')->first()->target_resolution_hours)->toBe(96);
    expect(SlaConfig::where('priority', 'low')->first()->target_resolution_hours)->toBe(240);
});

test('sla validation errors use Indonesian field names and guidance', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('sla.index'))
        ->put(route('sla.update'), [
            'configs' => [
                'urgent' => '',
                'normal' => 0,
                'low' => 8761,
            ],
        ]);

    $response
        ->assertRedirect(route('sla.index'))
        ->assertSessionHasErrors([
            'configs.urgent' => 'Target SLA Mendesak wajib diisi.',
            'configs.normal' => 'Target SLA Normal minimal 1 jam.',
            'configs.low' => 'Target SLA Rendah maksimal 8.760 jam.',
        ]);
});
