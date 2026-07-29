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
            self::Planning => 'Planning (Perencanaan)',
            self::InProgress => 'In Progress (Development)',
            self::OnHold => 'On Hold (Ditunda)',
            self::CompletedPendingDeployment => 'Selesai (Pending Deploy)',
            self::DeployedRunning => 'Deployed (Berjalan Normal)',
            self::DeployedMaintenance => 'Deployed (Maintenance)',
        };
    }
}
