<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Planning = 'planning';
    case InProgress = 'in_progress';
    case OnHold = 'on_hold';
    case CompletedPendingDeployment = 'completed_pending_deployment';
    case DeployedRunning = 'deployed_running';
    case DeployedMaintenance = 'deployed_maintenance';
}
