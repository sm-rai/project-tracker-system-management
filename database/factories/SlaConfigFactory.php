<?php

namespace Database\Factories;

use App\Enums\Priority;
use App\Models\SlaConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SlaConfig>
 */
class SlaConfigFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'priority' => fake()->randomElement(Priority::cases()),
            'target_resolution_hours' => fake()->numberBetween(1, 336),
        ];
    }

    public function urgent(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => Priority::Urgent,
            'target_resolution_hours' => 24,
        ]);
    }

    public function normal(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => Priority::Normal,
            'target_resolution_hours' => 72,
        ]);
    }

    public function low(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => Priority::Low,
            'target_resolution_hours' => 168,
        ]);
    }
}
