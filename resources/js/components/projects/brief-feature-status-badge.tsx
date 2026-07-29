import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BriefFeatureStatusType } from '@/types/project';
import { IconCheck, IconCircleDot, IconClock } from '@tabler/icons-react';

interface BriefFeatureStatusBadgeProps {
    status: BriefFeatureStatusType;
    className?: string;
}

export function BriefFeatureStatusBadge({ status, className }: BriefFeatureStatusBadgeProps) {
    switch (status) {
        case 'todo':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-muted-foreground/30 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
                        className,
                    )}
                >
                    <IconCircleDot className="size-3" />
                    To Do
                </Badge>
            );
        case 'in_progress':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-blue-500/30 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700',
                        className,
                    )}
                >
                    <IconClock className="size-3" />
                    In Progress
                </Badge>
            );
        case 'done':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-[#3F7A4A]/30 bg-[#E5F0E5] px-2 py-0.5 text-xs font-medium text-[#3F7A4A]',
                        className,
                    )}
                >
                    <IconCheck className="size-3" />
                    Done
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
