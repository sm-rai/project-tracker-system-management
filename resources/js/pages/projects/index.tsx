import React, { useEffect, useRef, useState } from 'react';
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

import { AppSidebar } from '@/components/app-sidebar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { ProgressBar } from '@/components/projects/progress-bar';
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
import { useFlashToast } from '@/hooks/use-flash-toast';
import { cn } from '@/lib/utils';
import type { PaginatedProjects, Project } from '@/types/project';

interface ProjectsIndexProps {
    projects: PaginatedProjects;
    filters: {
        search: string;
        status: string;
    };
    statuses: Array<{ value: string; label: string }>;
}

export default function ProjectsIndex({
    projects,
    filters,
    statuses,
}: ProjectsIndexProps) {
    useFlashToast();

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
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
                        {/* Page Header + Direct Primary Action */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 md:pt-2">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#25211E]">
                                    Project & Sistem
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Daftar lengkap project pengembangan & sistem operasional beserta progress realisasi brief fitur.
                                </p>
                            </div>

                            <Link href="/projects/create">
                                <Button size="sm" className="h-9 gap-1.5 bg-[#AF4424] text-white hover:bg-[#8C361D] shadow-xs">
                                    <IconPlus className="size-4" />
                                    <span>Tambah Project Baru</span>
                                </Button>
                            </Link>
                        </div>

                        {/* Direct Filter Toolbar */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            {/* Search Input */}
                            <div className="relative max-w-sm flex-1">
                                <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama project atau deskripsi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 border-[#E7DFD5] bg-background pl-9 pr-8 text-xs focus-visible:ring-[#AF4424]/30"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            applyFilters('', statusFilter);
                                        }}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-[#25211E]"
                                    >
                                        <IconX className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Lifecycle Select */}
                            <Select value={statusFilter} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-9 w-full border-[#E7DFD5] bg-background text-xs sm:w-[190px]">
                                    <SelectValue placeholder="Semua Status Lifecycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">Semua Status Lifecycle</SelectItem>
                                    {statuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value} className="text-xs">
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
                                    className="h-9 text-xs text-muted-foreground hover:text-[#25211E]"
                                >
                                    <IconX className="mr-1 size-3" />
                                    Reset Filter
                                </Button>
                            )}
                        </div>

                        {/* Projects Data Table */}
                        <div className="overflow-hidden rounded-lg border border-[#E7DFD5] bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#E7DFD5] hover:bg-transparent bg-[#FAF7F2]/60">
                                        <TableHead className="h-10 text-xs font-semibold text-muted-foreground">
                                            Nama Project / Sistem
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-semibold text-muted-foreground">
                                            Status Lifecycle
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-semibold text-muted-foreground w-60">
                                            Realisasi Brief Fitur
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-semibold text-muted-foreground">
                                            Target End Date
                                        </TableHead>
                                        <TableHead className="h-10 text-right text-xs font-semibold text-muted-foreground">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.data.length > 0 ? (
                                        projects.data.map((proj) => (
                                            <TableRow key={proj.id} className="border-[#E7DFD5] transition-colors hover:bg-[#FAF7F2]/40">
                                                {/* Project Name & Description */}
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link
                                                            href={`/projects/${proj.id}`}
                                                            className="text-sm font-semibold text-[#25211E] hover:text-[#AF4424] transition-colors"
                                                        >
                                                            {proj.name}
                                                        </Link>
                                                        {proj.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                                {proj.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Status Badge */}
                                                <TableCell>
                                                    <ProjectStatusBadge status={proj.status} />
                                                </TableCell>

                                                {/* OKR 1 Realization Progress Bar */}
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <ProgressBar value={proj.realization_percentage} size="sm" />
                                                        <span className="text-xs text-muted-foreground tabular-nums">
                                                            {proj.brief_features_count ?? 0} brief feature tercatat
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Target Date */}
                                                <TableCell className="text-sm text-[#25211E] tabular-nums">
                                                    {proj.target_end_date ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <IconCalendar className="size-3.5 shrink-0" />
                                                            <span>
                                                                {new Date(proj.target_end_date).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <TooltipProvider>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/projects/${proj.id}`}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8 text-muted-foreground hover:bg-[#FAF7F2] hover:text-[#AF4424]"
                                                                        >
                                                                            <IconEye className="size-4" />
                                                                            <span className="sr-only">Detail</span>
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">Detail & Brief Features</TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/projects/${proj.id}/edit`}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-8 text-muted-foreground hover:bg-[#FAF7F2] hover:text-[#25211E]"
                                                                        >
                                                                            <IconPencil className="size-4" />
                                                                            <span className="sr-only">Edit</span>
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">Edit Project</TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                                                        onClick={() => setConfirmState({ open: true, project: proj })}
                                                                    >
                                                                        <IconTrash className="size-4" />
                                                                        <span className="sr-only">Hapus</span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs">Hapus Project</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-44 text-center">
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-2">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-[#FAF7F2] text-muted-foreground border border-[#E7DFD5]">
                                                        <IconSearchOff className="size-5" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-[#25211E]">Project Tidak Ditemukan</h3>
                                                    <p className="text-center text-xs leading-normal text-muted-foreground">
                                                        Belum ada project yang cocok dengan kriteria pencarian atau filter saat ini.
                                                    </p>
                                                    {hasActiveFilter && (
                                                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-1 h-8 text-xs">
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#E7DFD5] px-4 py-3 bg-[#FAF7F2]/30">
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Menampilkan <span className="font-medium text-[#25211E]">{projects.from || 0}–{projects.to || 0}</span> dari total {projects.total} project
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
                                                        buttonVariants({ variant: 'ghost', size: 'default' }),
                                                        'h-8 gap-1 px-2.5 text-xs',
                                                        !prevLink && 'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <IconChevronLeft className="size-4" />
                                                    <span className="hidden sm:block">Previous</span>
                                                </Link>
                                            </PaginationItem>

                                            {projects.links.slice(1, -1).map((link, idx) => {
                                                if (link.label === '...') {
                                                    return (
                                                        <PaginationItem key={idx}>
                                                            <span className="flex size-8 items-center justify-center text-muted-foreground">
                                                                <IconDots className="size-4" />
                                                            </span>
                                                        </PaginationItem>
                                                    );
                                                }
                                                return (
                                                    <PaginationItem key={idx}>
                                                        <Link
                                                            href={link.url || '#'}
                                                            preserveState
                                                            preserveScroll
                                                            className={cn(
                                                                buttonVariants({
                                                                    variant: link.active ? 'outline' : 'ghost',
                                                                    size: 'icon',
                                                                }),
                                                                'h-8 size-8 text-xs font-medium',
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
                                                        buttonVariants({ variant: 'ghost', size: 'default' }),
                                                        'h-8 gap-1 px-2.5 text-xs',
                                                        !nextLink && 'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <span className="hidden sm:block">Next</span>
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
                onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
                title={`Hapus Project ${confirmState.project?.name || ''}?`}
                description="Tindakan ini akan menghapus project beserta seluruh catatan brief features di dalamnya secara permanen."
                variant="danger"
                confirmText="Ya, Hapus Project"
                onConfirm={handleDelete}
            />
        </>
    );
}
