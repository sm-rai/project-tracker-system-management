import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const noSystemValue = 'none';

const projectStatusLabels: Record<string, string> = {
    deployed_running: 'Berjalan',
    deployed_maintenance: 'Dalam pemeliharaan',
};

interface SystemProject {
    id: number;
    name: string;
    status: string;
}

interface SystemComboboxProps {
    id: string;
    projects: SystemProject[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    allowNoSystem?: boolean;
    ariaInvalid?: boolean;
    ariaDescribedBy?: string;
}

function getProjectStatusLabel(status: string): string {
    return projectStatusLabels[status] || 'Status tidak diketahui';
}

function getStatusBadgeClass(status: string): string {
    if (status === 'deployed_running') {
        return 'border-success/30 bg-success-surface text-success';
    }

    if (status === 'deployed_maintenance') {
        return 'border-info/30 bg-info-surface text-info';
    }

    return 'border-border bg-muted text-muted-foreground';
}

export function SystemCombobox({
    id,
    projects,
    value,
    onValueChange,
    placeholder,
    allowNoSystem = false,
    ariaInvalid = false,
    ariaDescribedBy,
}: SystemComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const selectedProject = projects.find(
        (project) => project.id.toString() === value,
    );
    const isNoSystemSelected = allowNoSystem && value === noSystemValue;
    const hasSelection = Boolean(selectedProject || isNoSystemSelected);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredProjects = useMemo(() => {
        if (!normalizedQuery) {
            return projects;
        }

        return projects.filter((project) =>
            `${project.name} ${getProjectStatusLabel(project.status)}`
                .toLocaleLowerCase()
                .includes(normalizedQuery),
        );
    }, [normalizedQuery, projects]);
    const showNoSystemOption =
        allowNoSystem &&
        (!normalizedQuery ||
            'issue umum tidak terkait sistem tertentu'.includes(
                normalizedQuery,
            ));
    const optionsId = `${id}-options`;

    useEffect(() => {
        if (!open) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });

        return () => cancelAnimationFrame(frame);
    }, [open]);

    const selectValue = (nextValue: string) => {
        onValueChange(nextValue);
        setQuery('');
        setOpen(false);
    };

    return (
        <div className="grid min-w-0 gap-1.5">
            <Popover
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);

                    if (!nextOpen) {
                        setQuery('');
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className={cn(
                            'h-11 w-full min-w-0 justify-between gap-2 px-3 text-left font-normal md:h-9',
                            !hasSelection && 'text-muted-foreground',
                        )}
                        aria-invalid={ariaInvalid}
                        aria-describedby={ariaDescribedBy}
                        aria-expanded={open}
                        aria-controls={optionsId}
                        aria-label={
                            selectedProject
                                ? `${selectedProject.name}, Status: ${getProjectStatusLabel(selectedProject.status)}`
                                : isNoSystemSelected
                                  ? 'Issue umum, tidak terkait sistem tertentu'
                                  : placeholder
                        }
                    >
                        <span className="min-w-0 truncate">
                            {selectedProject?.name ||
                                (isNoSystemSelected
                                    ? 'Issue umum'
                                    : placeholder)}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    id={optionsId}
                    align="start"
                    className="w-[min(32rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-2"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                }
                            }}
                            placeholder="Cari nama sistem..."
                            aria-label="Cari sistem"
                            className="h-9 pl-9"
                        />
                    </div>

                    <div
                        role="listbox"
                        aria-label="Daftar sistem"
                        className="mt-2 max-h-64 space-y-1 overflow-y-auto"
                    >
                        {showNoSystemOption && (
                            <Button
                                type="button"
                                variant="ghost"
                                role="option"
                                aria-selected={isNoSystemSelected}
                                className="h-auto min-h-10 w-full justify-between gap-3 px-2 py-2 text-left font-normal"
                                onClick={() => selectValue(noSystemValue)}
                            >
                                <span className="flex min-w-0 flex-col items-start gap-0.5">
                                    <span className="block truncate font-medium">
                                        Issue umum
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Tidak terkait sistem tertentu
                                    </span>
                                </span>
                                <Check
                                    className={cn(
                                        'size-4 shrink-0',
                                        isNoSystemSelected
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                    )}
                                />
                            </Button>
                        )}

                        {filteredProjects.map((project) => {
                            const isSelected =
                                selectedProject?.id === project.id;

                            return (
                                <Button
                                    key={project.id}
                                    type="button"
                                    variant="ghost"
                                    role="option"
                                    aria-selected={isSelected}
                                    className="h-auto min-h-10 w-full justify-between gap-3 px-2 py-2 text-left font-normal"
                                    onClick={() =>
                                        selectValue(project.id.toString())
                                    }
                                >
                                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                                        <span className="block max-w-full truncate font-medium">
                                            {project.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            Status:{' '}
                                            {getProjectStatusLabel(
                                                project.status,
                                            )}
                                        </span>
                                    </span>
                                    <Check
                                        className={cn(
                                            'size-4 shrink-0',
                                            isSelected
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </Button>
                            );
                        })}

                        {!showNoSystemOption &&
                            filteredProjects.length === 0 && (
                                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                                    Sistem tidak ditemukan.
                                </p>
                            )}
                    </div>
                </PopoverContent>
            </Popover>

            {selectedProject && (
                <Badge
                    variant="outline"
                    className={cn(
                        'w-fit rounded-full px-2 py-0.5 text-xs font-medium',
                        getStatusBadgeClass(selectedProject.status),
                    )}
                >
                    Status: {getProjectStatusLabel(selectedProject.status)}
                </Badge>
            )}
        </div>
    );
}
