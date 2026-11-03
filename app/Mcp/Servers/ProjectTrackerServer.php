<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\CreateBriefFeaturesTool;
use App\Mcp\Tools\CreateFeatureRequestRecordTool;
use App\Mcp\Tools\CreateFeatureRequestTool;
use App\Mcp\Tools\CreateIssueRecordTool;
use App\Mcp\Tools\CreateIssueTool;
use App\Mcp\Tools\CreateProjectTool;
use App\Mcp\Tools\DeleteBriefFeatureTool;
use App\Mcp\Tools\DeleteFeatureRequestTool;
use App\Mcp\Tools\DeleteIssueTool;
use App\Mcp\Tools\DeleteProjectTool;
use App\Mcp\Tools\GetBriefFeatureTool;
use App\Mcp\Tools\GetFeatureRequestTool;
use App\Mcp\Tools\GetIssueTool;
use App\Mcp\Tools\GetProjectTool;
use App\Mcp\Tools\ListAllProjectsTool;
use App\Mcp\Tools\ListBriefFeatureProjectsTool;
use App\Mcp\Tools\ListBriefFeaturesTool;
use App\Mcp\Tools\ListFeatureRequestsTool;
use App\Mcp\Tools\ListIssuesTool;
use App\Mcp\Tools\ListProjectsTool;
use App\Mcp\Tools\UpdateBriefFeatureTool;
use App\Mcp\Tools\UpdateFeatureRequestTool;
use App\Mcp\Tools\UpdateIssueTool;
use App\Mcp\Tools\UpdateProjectTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;
use Laravel\Mcp\Server\Tool;

#[Name('Project Tracker')]
#[Version('1.3.0')]
#[Instructions('Use list-all-tracker-projects to manage projects across all statuses; keep list-tracker-projects for deployed projects when importing GitHub changes. The server provides CRUD for Projects, Brief Features, Issues, and Feature Requests. Require explicit user approval before every write and set confirmed=true only after approval. Fetch item details and show the impact before deletion. Deleting a Project also deletes its Brief Features and Feature Requests and unlinks its Issues. Use create-tracker-issue-record and create-tracker-feature-request-record for manual records; keep create-tracker-issue and create-tracker-feature-request for confirmed GitHub imports with canonical source_url values. For Brief Features, call list-brief-feature-projects, verify its environment, show a preview, and call create-tracker-brief-features only after explicit user confirmation.')]
class ProjectTrackerServer extends Server
{
    /**
     * @var array<int, class-string<Tool>>
     */
    protected array $tools = [
        ListProjectsTool::class,
        ListAllProjectsTool::class,
        GetProjectTool::class,
        CreateProjectTool::class,
        UpdateProjectTool::class,
        DeleteProjectTool::class,
        ListBriefFeatureProjectsTool::class,
        ListBriefFeaturesTool::class,
        GetBriefFeatureTool::class,
        CreateBriefFeaturesTool::class,
        UpdateBriefFeatureTool::class,
        DeleteBriefFeatureTool::class,
        ListIssuesTool::class,
        GetIssueTool::class,
        CreateIssueRecordTool::class,
        UpdateIssueTool::class,
        DeleteIssueTool::class,
        CreateIssueTool::class,
        ListFeatureRequestsTool::class,
        GetFeatureRequestTool::class,
        CreateFeatureRequestRecordTool::class,
        UpdateFeatureRequestTool::class,
        DeleteFeatureRequestTool::class,
        CreateFeatureRequestTool::class,
    ];
}
