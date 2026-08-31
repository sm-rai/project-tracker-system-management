<?php

use App\Http\Middleware\ThrottleProjectTrackerMcpByIp;
use App\Mcp\Servers\ProjectTrackerServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::local('project-tracker', ProjectTrackerServer::class);

Mcp::web('/mcp/project-tracker', ProjectTrackerServer::class)
    ->middleware([
        ThrottleProjectTrackerMcpByIp::class,
        'auth:sanctum',
        'abilities:mcp:use',
        'throttle:project-tracker-mcp',
    ])
    ->name('mcp.project-tracker');
