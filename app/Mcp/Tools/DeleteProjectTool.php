<?php

namespace App\Mcp\Tools;

use App\Models\Project;
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

#[Name('delete-tracker-project')]
#[Description('Permanently deletes a project after user confirmation. Brief Features and Feature Requests are deleted; related Issues remain without a project.')]
#[IsDestructive]
class DeleteProjectTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => ['required', 'integer', Rule::exists((new Project)->getTable(), 'id')],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Tampilkan dampak penghapusan dan minta persetujuan pengguna sebelum menghapus project.',
        ]);

        return DB::transaction(function () use ($validated): Response {
            $project = Project::query()
                ->whereKey($validated['project_id'])
                ->lockForUpdate()
                ->firstOrFail();
            $impact = [
                'brief_features_deleted' => $project->briefFeatures()->count(),
                'feature_requests_deleted' => $project->featureRequests()->count(),
                'issues_unlinked' => $project->issues()->count(),
            ];
            $projectName = $project->name;
            $project->delete();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'deleted',
                'project_id' => (int) $validated['project_id'],
                'project_name' => $projectName,
                'impact' => $impact,
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Project ID to delete.')->required(),
            'confirmed' => $schema->boolean()->description('Must be true only after the user reviews related-record deletion and confirms.')->required(),
        ];
    }
}
