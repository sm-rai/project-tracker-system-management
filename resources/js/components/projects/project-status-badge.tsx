import {
    IconCalendarTime,
    IconChecklist,
    IconClock,
    IconPlayerPause,
    IconRocket,
    IconTools,
} from '@tabler/icons-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectStatusType } from '@/types/project';

interface ProjectStatusBadgeProps {
    status: ProjectStatusType;
    className?: string;
}

export function ProjectStatusBadge({
    status,
    className,
}: ProjectStatusBadgeProps) {
    switch (status) {
        case 'planning':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-pending/30 bg-pending-surface px-2.5 py-0.5 text-xs font-medium text-pending',
                        className,
                    )}
                >
                    <IconCalendarTime className="size-3" />
                    Perencanaan
                </Badge>
            );
        case 'in_progress':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-info/30 bg-info-surface px-2.5 py-0.5 text-xs font-medium text-info',
                        className,
                    )}
                >
                    <IconClock className="size-3" />
                    Sedang Berjalan
                </Badge>
            );
        case 'on_hold':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-warning/30 bg-warning-surface px-2.5 py-0.5 text-xs font-medium text-warning',
                        className,
                    )}
                >
                    <IconPlayerPause className="size-3" />
                    Ditunda
                </Badge>
            );
        case 'completed_pending_deployment':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary',
                        className,
                    )}
                >
                    <IconChecklist className="size-3" />
                    Menunggu Deployment
                </Badge>
            );
        case 'deployed_running':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-success/30 bg-success-surface px-2.5 py-0.5 text-xs font-medium text-success',
                        className,
                    )}
                >
                    <IconRocket className="size-3" />
                    Aktif
                </Badge>
            );
        case 'deployed_maintenance':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-info/30 bg-info-surface px-2.5 py-0.5 text-xs font-medium text-info',
                        className,
                    )}
                >
                    <IconTools className="size-3" />
                    Pemeliharaan
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className={className}>
                    {status}
                </Badge>
            );
    }
}
