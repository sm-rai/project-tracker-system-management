import { Head, Link, router } from '@inertiajs/react';
import {
    IconCalendar,
    IconChevronLeft,
    IconChevronRight,
    IconDots,
    IconEye,
    IconPencil,
    IconPlus,
    IconSearch,
    IconSearchOff,
    IconTrash,
    IconX,
} from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ProgressBar } from '@/components/projects/progress-bar';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { SiteHeader } from '@/components/site-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
    PaginatedProjects,
    Project,
    ProjectStatusType,
} from '@/types/project';

interface ProjectsIndexProps {
    projects: PaginatedProjects;
    filters: {
        search: string;
        status: string;
    };
    statuses: Array<{ value: string; label: string }>;
}

const developmentStatuses: ProjectStatusType[] = [
    'planning',
    'in_progress',
    'on_hold',
    'completed_pending_deployment',
];

function isDevelopmentProject(status: ProjectStatusType): boolean {
    return developmentStatuses.includes(status);
}

export default function ProjectsIndex({
    projects,
    filters,
    statuses,
}: ProjectsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(
        filters.status || 'all',
    );
    const isFirstRender = useRef(true);

    const applyFilters = (search: string, status: string) => {
        router.get(
            '/projects',
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            applyFilters(searchQuery, statusFilter);
        }, 300);

        return () => clearTimeout(timer);
        // Status changes apply immediately; only the free-text search is debounced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        applyFilters(searchQuery, value);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        router.get('/projects', {}, { preserveState: true, replace: true });
    };

    // State for Confirm Delete Dialog
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        project?: Project | null;
    }>({
        open: false,
        project: null,
    });

    const handleDelete = () => {
        if (confirmState.project) {
            router.delete(`/projects/${confirmState.project.id}`, {
                preserveScroll: true,
            });
        }
    };

    const hasActiveFilter = searchQuery.trim() !== '' || statusFilter !== 'all';
    const prevLink = projects.links[0]?.url;
    const nextLink = projects.links[projects.links.length - 1]?.url;

    return (
        <>
            <Head title="Project & Sistem — System Management" />
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': 'calc(var(--spacing) * 72)',
                        '--header-height': 'calc(var(--spacing) * 12)',
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader title="Project & Sistem" />

                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0">
                        {/* Page Header */}
                        <div className="flex flex-col gap-1 pt-4 md:pt-2">
                            <div>
                                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                    Project & Sistem
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Kelola project pengembangan dan sistem
                                    operasional, lalu pantau progress realisasi
                                    brief feature.
                                </p>
                            </div>
                        </div>

                        {/* Direct Filter Toolbar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative max-w-sm flex-1">
                                    <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        aria-label="Cari project atau sistem"
                                        placeholder="Cari nama project atau deskripsi..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="h-9 border-border bg-background pr-8 pl-9 text-sm focus-visible:ring-ring/30"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            aria-label="Hapus pencarian"
                                            onClick={() => {
                                                setSearchQuery('');
                                                applyFilters('', statusFilter);
                                            }}
                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <IconX className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <Select
                                    value={statusFilter}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger
                                        aria-label="Filter status lifecycle"
                                        className="h-11 w-full shrink-0 border-border bg-background text-sm sm:w-[220px] lg:h-9"
                                    >
                                        <SelectValue placeholder="Semua Lifecycle" />
                                    </SelectTrigger>
                                    <SelectContent className="min-w-[220px]">
                                        <SelectItem value="all">
                                            Semua Lifecycle
                                        </SelectItem>
                                        {statuses.map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {hasActiveFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="h-11 self-start text-xs text-muted-foreground hover:text-foreground sm:self-auto lg:h-9"
                                    >
                                        <IconX className="mr-1 size-3" />
                                        Reset Filter
                                    </Button>
                                )}
                            </div>

                            <Button
                                asChild
                                size="sm"
                                className="h-11 gap-1.5 bg-primary font-medium text-primary-foreground shadow-xs hover:bg-primary-hover lg:h-9"
                            >
                                <Link href="/projects/create">
                                    <IconPlus className="size-4" />
                                    <span>Tambah Project</span>
                                </Link>
                            </Button>
                        </div>

                        {/* Projects Data Table */}
                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Nama Project / Sistem
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Status Lifecycle
                                        </TableHead>
                                        <TableHead className="h-10 w-60 text-xs font-medium text-muted-foreground">
                                            Realisasi Brief Fitur (OKR 1)
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Tanggal Target Selesai
                                        </TableHead>
                                        <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.data.length > 0 ? (
                                        projects.data.map((proj) => (
                                            <TableRow
                                                key={proj.id}
                                                className="border-border transition-colors hover:bg-muted/30"
                                            >
                                                {/* Project Name */}
                                                <TableCell>
                                                    <Link
                                                        href={`/projects/${proj.id}`}
                                                        className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                                                    >
                                                        {proj.name}
                                                    </Link>
                                                </TableCell>

                                                {/* Status Badge */}
                                                <TableCell>
                                                    <ProjectStatusBadge
                                                        status={proj.status}
                                                    />
                                                </TableCell>

                                                {/* OKR 1 Realization Progress Bar */}
                                                <TableCell>
                                                    {isDevelopmentProject(
                                                        proj.status,
                                                    ) ? (
                                                        proj.brief_features_count ? (
                                                            <div className="flex flex-col gap-1">
                                                                <ProgressBar
                                                                    value={
                                                                        proj.realization_percentage
                                                                    }
                                                                    size="sm"
                                                                />
                                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                                    {
                                                                        proj.brief_features_count
                                                                    }{' '}
                                                                    brief fitur
                                                                    tercatat
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Belum ada brief
                                                                fitur
                                                            </span>
                                                        )
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm text-muted-foreground">
                                                                —
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Tidak berlaku
                                                                untuk sistem
                                                                operasional
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Target Date */}
                                                <TableCell className="text-sm text-foreground tabular-nums">
                                                    {proj.target_end_date ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <IconCalendar className="size-3.5 shrink-0" />
                                                            <span>
                                                                {new Date(
                                                                    proj.target_end_date,
                                                                ).toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <TooltipProvider>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        asChild
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-11 text-muted-foreground hover:bg-muted hover:text-foreground lg:size-8"
                                                                    >
                                                                        <Link
                                                                            href={`/projects/${proj.id}`}
                                                                        >
                                                                            <IconEye className="size-4" />
                                                                            <span className="sr-only">
                                                                                Lihat
                                                                                detail
                                                                                project
                                                                            </span>
                                                                        </Link>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">
                                                                    Lihat Detail
                                                                    & Brief
                                                                    Features
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        asChild
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-11 text-muted-foreground hover:bg-muted hover:text-foreground lg:size-8"
                                                                    >
                                                                        <Link
                                                                            href={`/projects/${proj.id}/edit`}
                                                                        >
                                                                            <IconPencil className="size-4" />
                                                                            <span className="sr-only">
                                                                                Edit
                                                                                project
                                                                            </span>
                                                                        </Link>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">
                                                                    Edit Project
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-11 text-muted-foreground hover:bg-danger-surface hover:text-danger lg:size-8"
                                                                        onClick={() =>
                                                                            setConfirmState(
                                                                                {
                                                                                    open: true,
                                                                                    project:
                                                                                        proj,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <IconTrash className="size-4" />
                                                                        <span className="sr-only">
                                                                            Hapus
                                                                        </span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">
                                                                    Hapus
                                                                    Project
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-44 text-center"
                                            >
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-2">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <IconSearchOff className="size-5" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        Project Tidak Ditemukan
                                                    </h3>
                                                    <p className="text-center text-xs leading-normal text-muted-foreground">
                                                        Belum ada project yang
                                                        cocok dengan kriteria
                                                        pencarian atau filter
                                                        saat ini.
                                                    </p>
                                                    {hasActiveFilter && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleResetFilters
                                                            }
                                                            className="mt-1 h-8 text-xs"
                                                        >
                                                            Reset Filter
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Table Footer */}
                            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Menampilkan{' '}
                                    <span className="font-medium text-foreground">
                                        {projects.from || 0}–{projects.to || 0}
                                    </span>{' '}
                                    dari total {projects.total} project
                                </p>

                                {projects.last_page > 1 && (
                                    <Pagination className="mx-0 w-auto">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <Link
                                                    href={prevLink || '#'}
                                                    preserveState
                                                    preserveScroll
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: 'ghost',
                                                            size: 'default',
                                                        }),
                                                        'h-11 gap-1 px-2.5 text-xs lg:h-8',
                                                        !prevLink &&
                                                            'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <IconChevronLeft className="size-4" />
                                                    <span className="hidden sm:block">
                                                        Sebelumnya
                                                    </span>
                                                </Link>
                                            </PaginationItem>

                                            {projects.links
                                                .slice(1, -1)
                                                .map((link, idx) => {
                                                    if (link.label === '...') {
                                                        return (
                                                            <PaginationItem
                                                                key={idx}
                                                            >
                                                                <span className="flex size-8 items-center justify-center text-muted-foreground">
                                                                    <IconDots className="size-4" />
                                                                </span>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return (
                                                        <PaginationItem
                                                            key={idx}
                                                        >
                                                            <Link
                                                                href={
                                                                    link.url ||
                                                                    '#'
                                                                }
                                                                preserveState
                                                                preserveScroll
                                                                className={cn(
                                                                    buttonVariants(
                                                                        {
                                                                            variant:
                                                                                link.active
                                                                                    ? 'outline'
                                                                                    : 'ghost',
                                                                            size: 'icon',
                                                                        },
                                                                    ),
                                                                    'size-11 h-11 text-xs font-medium lg:size-8 lg:h-8',
                                                                )}
                                                            >
                                                                {link.label}
                                                            </Link>
                                                        </PaginationItem>
                                                    );
                                                })}

                                            <PaginationItem>
                                                <Link
                                                    href={nextLink || '#'}
                                                    preserveState
                                                    preserveScroll
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: 'ghost',
                                                            size: 'default',
                                                        }),
                                                        'h-11 gap-1 px-2.5 text-xs lg:h-8',
                                                        !nextLink &&
                                                            'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <span className="hidden sm:block">
                                                        Berikutnya
                                                    </span>
                                                    <IconChevronRight className="size-4" />
                                                </Link>
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmState.open}
                onOpenChange={(open) =>
                    setConfirmState((prev) => ({ ...prev, open }))
                }
                title={`Hapus Project ${confirmState.project?.name || ''}?`}
                description="Tindakan ini akan menghapus project beserta seluruh catatan brief features di dalamnya secara permanen."
                variant="danger"
                confirmText="Ya, Hapus Project"
                onConfirm={handleDelete}
            />
        </>
    );
}
