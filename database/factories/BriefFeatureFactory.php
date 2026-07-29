<?php

namespace Database\Factories;

use App\Enums\BriefFeatureStatus;
use App\Models\BriefFeature;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BriefFeature>
 */
class BriefFeatureFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => BriefFeatureStatus::Todo,
        ];
    }

    public function todo(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BriefFeatureStatus::Todo,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BriefFeatureStatus::InProgress,
        ]);
    }

    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BriefFeatureStatus::Done,
        ]);
    }
}
