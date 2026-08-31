<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\CreateFeatureRequestTool;
use App\Mcp\Tools\CreateIssueTool;
use App\Mcp\Tools\ListProjectsTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;
use Laravel\Mcp\Server\Tool;

#[Name('Project Tracker')]
#[Version('1.1.0')]
#[Instructions('Use list-tracker-projects before importing GitHub changes and verify its environment matches the target requested by the user. Only call a create tool after the user confirms the classified candidates. Always pass the canonical GitHub URL as source_url. For merged changes, include resolved_at or fulfilled_at together with a completion note.')]
class ProjectTrackerServer extends Server
{
    /**
     * @var array<int, class-string<Tool>>
     */
    protected array $tools = [
        ListProjectsTool::class,
        CreateIssueTool::class,
        CreateFeatureRequestTool::class,
    ];
}
