<?php

namespace Database\Factories;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\RootCauseCategory;
use App\Models\Issue;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Issue>
 */
class IssueFactory extends Factory
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
            'root_cause_category' => fake()->randomElement(RootCauseCategory::cases()),
            'reported_at' => now(),
            'status' => IssueStatus::Open,
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'resolved_at' => now(),
            'status' => IssueStatus::Resolved,
            'resolution_note' => fake()->paragraph(),
        ]);
    }
}
