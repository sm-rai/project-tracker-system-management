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

    public function label(): string
    {
        return match ($this) {
            self::Planning => 'Planning',
            self::InProgress => 'In Progress',
            self::OnHold => 'On Hold',
            self::CompletedPendingDeployment => 'Pending Deploy',
            self::DeployedRunning => 'Running',
            self::DeployedMaintenance => 'Maintenance',
        };
    }
}
