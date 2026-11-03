<?php

namespace App\Mcp\Tools;

use App\Models\Issue;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsDestructive;

#[Name('delete-tracker-issue')]
#[Description('Permanently deletes an issue after user confirmation.')]
#[IsDestructive]
class DeleteIssueTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'issue_id' => ['required', 'integer', Rule::exists((new Issue)->getTable(), 'id')],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum menghapus issue.',
        ]);

        return DB::transaction(function () use ($validated): Response {
            $issue = Issue::query()
                ->whereKey($validated['issue_id'])
                ->lockForUpdate()
                ->firstOrFail();
            $deletedIssue = [
                'id' => $issue->id,
                'project_id' => $issue->project_id,
                'title' => $issue->title,
                'status' => $issue->status->value,
            ];
            $issue->delete();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'deleted',
                'issue' => $deletedIssue,
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'issue_id' => $schema->integer()->description('Issue ID to delete.')->required(),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves deletion.')->required(),
        ];
    }
}
