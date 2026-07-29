<?php

use App\Models\SlaConfig;
use App\Models\User;

test('authenticated user can view sla configuration page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('sla.index'));

    $response->assertOk();
});

test('user can update target resolution days for sla priorities', function () {
    $user = User::factory()->create();

    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_days' => 1]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_days' => 3]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_days' => 7]);

    $response = $this->actingAs($user)->put(route('sla.update'), [
        'configs' => [
            'urgent' => 2,
            'normal' => 4,
            'low' => 10,
        ],
    ]);

    $response
        ->assertRedirect()
        ->assertSessionHas('success', 'Konfigurasi SLA berhasil diperbarui.');
    expect(SlaConfig::where('priority', 'urgent')->first()->target_resolution_days)->toBe(2);
    expect(SlaConfig::where('priority', 'normal')->first()->target_resolution_days)->toBe(4);
    expect(SlaConfig::where('priority', 'low')->first()->target_resolution_days)->toBe(10);
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
                'low' => 366,
            ],
        ]);

    $response
        ->assertRedirect(route('sla.index'))
        ->assertSessionHasErrors([
            'configs.urgent' => 'Target SLA Mendesak wajib diisi.',
            'configs.normal' => 'Target SLA Normal minimal 1 hari kalender.',
            'configs.low' => 'Target SLA Rendah maksimal 365 hari kalender.',
        ]);
});
