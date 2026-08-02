import { IconCheck, IconCircleDot, IconClock } from '@tabler/icons-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BriefFeatureStatusType } from '@/types/project';

interface BriefFeatureStatusBadgeProps {
    status: BriefFeatureStatusType;
    className?: string;
}

export function BriefFeatureStatusBadge({
    status,
    className,
}: BriefFeatureStatusBadgeProps) {
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
                    Belum Dikerjakan
                </Badge>
            );
        case 'in_progress':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-info/30 bg-info-surface px-2 py-0.5 text-xs font-medium text-info',
                        className,
                    )}
                >
                    <IconClock className="size-3" />
                    Sedang Dikerjakan
                </Badge>
            );
        case 'done':
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'gap-1 rounded-full border-success/30 bg-success-surface px-2 py-0.5 text-xs font-medium text-success',
                        className,
                    )}
                >
                    <IconCheck className="size-3" />
                    Selesai
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
