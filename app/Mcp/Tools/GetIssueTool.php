<?php

namespace App\Mcp\Tools;

use App\Models\Issue;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get-tracker-issue')]
#[Description('Returns a complete issue and project context before it is changed or deleted.')]
#[IsReadOnly]
class GetIssueTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'issue_id' => ['required', 'integer', Rule::exists((new Issue)->getTable(), 'id')],
        ]);

        $issue = Issue::query()
            ->with('project:id,name,status')
            ->findOrFail($validated['issue_id']);

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'issue' => [
                'id' => $issue->id,
                'project_id' => $issue->project_id,
                'project_name' => $issue->project?->name,
                'project_status' => $issue->project?->status->value,
                'title' => $issue->title,
                'description' => $issue->description,
                'priority' => $issue->priority->value,
                'root_cause_category' => $issue->root_cause_category->value,
                'reported_at' => $issue->reported_at?->toIso8601String(),
                'due_date' => $issue->due_date?->toIso8601String(),
                'resolved_at' => $issue->resolved_at?->toIso8601String(),
                'status' => $issue->status->value,
                'resolution_note' => $issue->resolution_note,
                'is_on_time' => $issue->is_on_time,
                'created_at' => $issue->created_at?->toIso8601String(),
                'updated_at' => $issue->updated_at?->toIso8601String(),
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'issue_id' => $schema->integer()->description('Issue ID to inspect.')->required(),
        ];
    }
}
