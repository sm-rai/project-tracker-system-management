<?php

namespace Database\Factories;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Models\FeatureRequest;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FeatureRequest>
 */
class FeatureRequestFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory()->deployedRunning(),
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'priority' => fake()->randomElement(Priority::cases()),
            'requested_at' => now(),
            'status' => FeatureRequestStatus::Open,
        ];
    }

    public function fulfilled(): static
    {
        return $this->state(fn (array $attributes) => [
            'fulfilled_at' => now(),
            'status' => FeatureRequestStatus::Fulfilled,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => FeatureRequestStatus::InProgress,
        ]);
    }
}
