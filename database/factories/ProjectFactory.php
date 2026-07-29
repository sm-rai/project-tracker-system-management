<?php

namespace Database\Factories;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => ProjectStatus::Planning,
            'start_date' => fake()->date(),
            'target_end_date' => fake()->dateTimeBetween('+1 month', '+6 months')->format('Y-m-d'),
            'created_by' => User::factory()->admin(),
        ];
    }

    public function planning(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::Planning,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::InProgress,
        ]);
    }

    public function onHold(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::OnHold,
        ]);
    }

    public function completedPendingDeployment(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::CompletedPendingDeployment,
        ]);
    }

    public function deployedRunning(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::DeployedRunning,
        ]);
    }

    public function deployedMaintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProjectStatus::DeployedMaintenance,
        ]);
    }
}
