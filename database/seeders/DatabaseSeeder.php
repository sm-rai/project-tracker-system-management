<?php

namespace Database\Seeders;

use App\Enums\Priority;
use App\Enums\UserRole;
use App\Models\SlaConfig;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@rumahatsiri.com'],
            [
                'name' => 'Admin',
                'password' => 'password',
                'role' => UserRole::Admin,
            ],
        );

        User::updateOrCreate(
            ['email' => 'erwin@rumahatsiri.com'],
            [
                'name' => 'Erwin',
                'password' => 'password',
                'role' => UserRole::User,
            ],
        );

        SlaConfig::updateOrCreate(
            ['priority' => Priority::Urgent],
            ['target_resolution_days' => 1],
        );

        SlaConfig::updateOrCreate(
            ['priority' => Priority::Normal],
            ['target_resolution_days' => 3],
        );

        SlaConfig::updateOrCreate(
            ['priority' => Priority::Low],
            ['target_resolution_days' => 7],
        );
    }
}
