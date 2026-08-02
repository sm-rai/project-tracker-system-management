import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    value: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ProgressBar({
    value,
    showLabel = true,
    size = 'md',
    className,
}: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value));

    const heightClass = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-3.5',
    }[size];

    const isComplete = clampedValue >= 100;
    const barColor = isComplete ? 'bg-success' : 'bg-primary';

    return (
        <div className={cn('flex w-full items-center gap-2.5', className)}>
            <div
                className={cn(
                    'flex-1 overflow-hidden rounded-full bg-muted',
                    heightClass,
                )}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        barColor,
                    )}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
            {showLabel && (
                <span className="min-w-[42px] shrink-0 text-right text-xs font-semibold text-foreground tabular-nums">
                    {clampedValue}%
                </span>
            )}
        </div>
    );
}
