import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    value: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ProgressBar({ value, showLabel = true, size = 'md', className }: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value));

    const heightClass = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-3.5',
    }[size];

    const isComplete = clampedValue >= 100;
    const barColor = isComplete ? 'bg-[#3F7A4A]' : 'bg-[#AF4424]';

    return (
        <div className={cn('flex items-center gap-2.5 w-full', className)}>
            <div className={cn('flex-1 overflow-hidden rounded-full bg-[#E7DFD5]/60', heightClass)}>
                <div
                    className={cn('h-full transition-all duration-500 ease-out rounded-full', barColor)}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-semibold tabular-nums text-[#25211E] shrink-0 min-w-[42px] text-right">
                    {clampedValue}%
                </span>
            )}
        </div>
    );
}
