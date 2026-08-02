import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';

interface FilterPopoverProps {
    activeCount: number;
    children: ReactNode;
}

export function FilterPopover({ activeCount, children }: FilterPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-between gap-2 sm:w-auto lg:h-9"
                >
                    <span className="flex items-center gap-2">
                        <SlidersHorizontal className="size-4" />
                        Filter lanjutan
                    </span>
                    {activeCount > 0 && (
                        <Badge className="min-w-5 justify-center bg-primary-surface px-1.5 text-primary">
                            {activeCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[min(22rem,calc(100vw-2rem))]"
            >
                <PopoverHeader>
                    <PopoverTitle>Filter lanjutan</PopoverTitle>
                    <PopoverDescription>
                        Persempit data tanpa memenuhi toolbar utama.
                    </PopoverDescription>
                </PopoverHeader>
                <div className="mt-4">{children}</div>
            </PopoverContent>
        </Popover>
    );
}
