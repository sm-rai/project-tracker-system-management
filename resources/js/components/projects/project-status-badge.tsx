import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectStatusType } from '@/types/project';
import {
    IconCalendarTime,
    IconChecklist,
    IconClock,
    IconPlayerPause,
    IconRocket,
    IconTools,
} from '@tabler/icons-react';

interface ProjectStatusBadgeProps {
    status: ProjectStatusType;
    className?: string;
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
    switch (status) {
        case 'planning':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-[#9C842F]/30 bg-[#F2EACF] px-2.5 py-0.5 text-xs font-medium text-[#9C842F]',
                        className,
                    )}
                >
                    <IconCalendarTime className="size-3" />
                    Planning
                </Badge>
            );
        case 'in_progress':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-blue-500/30 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700',
                        className,
                    )}
                >
                    <IconClock className="size-3" />
                    In Progress
                </Badge>
            );
        case 'on_hold':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-[#B9772E]/30 bg-[#F6E8D6] px-2.5 py-0.5 text-xs font-medium text-[#B9772E]',
                        className,
                    )}
                >
                    <IconPlayerPause className="size-3" />
                    On Hold
                </Badge>
            );
        case 'completed_pending_deployment':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-purple-500/30 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700',
                        className,
                    )}
                >
                    <IconChecklist className="size-3" />
                    Pending Deploy
                </Badge>
            );
        case 'deployed_running':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-[#3F7A4A]/30 bg-[#E5F0E5] px-2.5 py-0.5 text-xs font-medium text-[#3F7A4A]',
                        className,
                    )}
                >
                    <IconRocket className="size-3" />
                    Deployed (Running)
                </Badge>
            );
        case 'deployed_maintenance':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-[#2F7C7A]/30 bg-[#DCEDEC] px-2.5 py-0.5 text-xs font-medium text-[#2F7C7A]',
                        className,
                    )}
                >
                    <IconTools className="size-3" />
                    Deployed (Maintenance)
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
