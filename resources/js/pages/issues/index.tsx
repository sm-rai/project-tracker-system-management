import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    MoreHorizontal,
    Plus,
    Search,
    SearchX,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FilterPopover } from '@/components/filter-popover';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';

interface Project {
    id: number;
    name: string;
    status: string;
}

interface Issue {
    id: number;
    project_id: number | null;
    title: string;
    description: string;
    priority: 'urgent' | 'normal' | 'low';
    root_cause_category: 'system_error' | 'non_system' | 'other';
    reported_at: string;
    due_date: string;
    resolved_at: string | null;
    status: 'open' | 'resolved';
    resolution_note: string | null;
    is_on_time: boolean | null;
    project?: Project;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface IssuesIndexProps {
    issues: PaginatedData<Issue>;
    filters: {
        search?: string;
        project_id?: string;
        priority?: string;
        status?: string;
        root_cause_category?: string;
        overdue?: boolean | string;
    };
    deployedProjects: Project[];
}

const rootCauseLabels: Record<string, string> = {
    system_error: 'System Error',
    non_system: 'Non-System',
    other: 'Other',
};

function getPriorityBadge(priority: string) {
    const className =
        priority === 'urgent'
            ? 'border-danger/20 bg-danger-surface text-danger'
            : priority === 'normal'
              ? 'border-warning/20 bg-warning-surface text-warning'
              : 'border-info/20 bg-info-surface text-info';

    return (
        <Badge variant="outline" className={className}>
            {priority === 'urgent'
                ? 'Urgent'
                : priority === 'normal'
                  ? 'Normal'
                  : 'Low'}
        </Badge>
    );
}

export default function IssuesIndexPage({
    issues,
    filters,
    deployedProjects,
}: IssuesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProject, setSelectedProject] = useState(
        filters.project_id || 'all',
    );
    const [selectedPriority, setSelectedPriority] = useState(
        filters.priority || 'all',
    );
    const [selectedStatus, setSelectedStatus] = useState(
        filters.status || 'all',
    );
    const [selectedRootCause, setSelectedRootCause] = useState(
        filters.root_cause_category || 'all',
    );
    const [overdue, setOverdue] = useState(
        filters.overdue === true || filters.overdue === '1',
    );
    const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);
    const isFirstRender = useRef(true);

    const applyFilters = (
        searchValue: string,
        projectValue: string,
        priorityValue: string,
        statusValue: string,
        rootCauseValue: string,
        overdueValue: boolean,
    ) => {
        router.get(
            '/issues',
            {
                search: searchValue || undefined,
                project_id: projectValue === 'all' ? undefined : projectValue,
                priority: priorityValue === 'all' ? undefined : priorityValue,
                status: statusValue === 'all' ? undefined : statusValue,
                root_cause_category:
                    rootCauseValue === 'all' ? undefined : rootCauseValue,
                overdue: overdueValue ? 1 : undefined,
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
            applyFilters(
                search,
                selectedProject,
                selectedPriority,
                selectedStatus,
                selectedRootCause,
                overdue,
            );
        }, 300);

        return () => clearTimeout(timer);
        // Select filters apply immediately; only the free-text search is debounced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleProjectChange = (value: string) => {
        setSelectedProject(value);
        applyFilters(
            search,
            value,
            selectedPriority,
            selectedStatus,
            selectedRootCause,
            overdue,
        );
    };

    const handlePriorityChange = (value: string) => {
        setSelectedPriority(value);
        applyFilters(
            search,
            selectedProject,
            value,
            selectedStatus,
            selectedRootCause,
            overdue,
        );
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        applyFilters(
            search,
            selectedProject,
            selectedPriority,
            value,
            selectedRootCause,
            overdue,
        );
    };

    const handleRootCauseChange = (value: string) => {
        setSelectedRootCause(value);
        applyFilters(
            search,
            selectedProject,
            selectedPriority,
            selectedStatus,
            value,
            overdue,
        );
    };

    const handleOverdueChange = (checked: boolean) => {
        setOverdue(checked);
        applyFilters(
            search,
            selectedProject,
            selectedPriority,
            selectedStatus,
            selectedRootCause,
            checked,
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedProject('all');
        setSelectedPriority('all');
        setSelectedStatus('all');
        setSelectedRootCause('all');
        setOverdue(false);
        router.get('/issues', {}, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (!issueToDelete) {
            return;
        }

        router.delete(`/issues/${issueToDelete.id}`, {
            onFinish: () => setIssueToDelete(null),
        });
    };

    const hasActiveFilter =
        search.trim() !== '' ||
        selectedProject !== 'all' ||
        selectedPriority !== 'all' ||
        selectedStatus !== 'all' ||
        selectedRootCause !== 'all' ||
        overdue;
    const activeAdvancedFilterCount = [
        selectedProject !== 'all',
        selectedPriority !== 'all',
        selectedStatus !== 'all',
        selectedRootCause !== 'all',
        overdue,
    ].filter(Boolean).length;
    const prevLink = issues.links[0]?.url;
    const nextLink = issues.links[issues.links.length - 1]?.url;

    return (
        <>
            <Head title="Issues" />
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': 'calc(var(--spacing) * 72)',
                        '--header-height': 'calc(var(--spacing) * 12)',
                    } as CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader title="Daftar Issue" />
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0">
                        <div className="flex flex-col gap-1 pt-4 md:pt-2">
                            <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                Issues
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Catat dan pantau issue teknis pada sistem
                                operasional, termasuk target penyelesaiannya
                                berdasarkan SLA.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                <div className="relative max-w-sm flex-1">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        aria-label="Cari issue"
                                        type="search"
                                        placeholder="Cari judul atau deskripsi issue..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        className="h-9 border-border bg-background pr-8 pl-9 text-sm focus-visible:ring-ring/30"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            aria-label="Hapus pencarian"
                                            onClick={() => {
                                                setSearch('');
                                                applyFilters(
                                                    '',
                                                    selectedProject,
                                                    selectedPriority,
                                                    selectedStatus,
                                                    selectedRootCause,
                                                    overdue,
                                                );
                                            }}
                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <FilterPopover
                                    activeCount={activeAdvancedFilterCount}
                                >
                                    <div className="grid gap-3">
                                        <Select
                                            value={selectedProject}
                                            onValueChange={handleProjectChange}
                                        >
                                            <SelectTrigger
                                                aria-label="Filter sistem"
                                                className="h-11 w-full border-border bg-background text-sm sm:w-[190px] lg:h-9"
                                            >
                                                <SelectValue placeholder="Semua Sistem" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua Sistem
                                                </SelectItem>
                                                <SelectItem value="unattached">
                                                    Infrastruktur / Umum
                                                </SelectItem>
                                                {deployedProjects.map(
                                                    (project) => (
                                                        <SelectItem
                                                            key={project.id}
                                                            value={String(
                                                                project.id,
                                                            )}
                                                        >
                                                            {project.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={selectedPriority}
                                            onValueChange={handlePriorityChange}
                                        >
                                            <SelectTrigger
                                                aria-label="Filter prioritas"
                                                className="h-11 w-full border-border bg-background text-sm sm:w-[150px] lg:h-9"
                                            >
                                                <SelectValue placeholder="Semua Prioritas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua Prioritas
                                                </SelectItem>
                                                <SelectItem value="urgent">
                                                    Urgent
                                                </SelectItem>
                                                <SelectItem value="normal">
                                                    Normal
                                                </SelectItem>
                                                <SelectItem value="low">
                                                    Low
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={selectedStatus}
                                            onValueChange={handleStatusChange}
                                        >
                                            <SelectTrigger
                                                aria-label="Filter status issue"
                                                className="h-11 w-full border-border bg-background text-sm sm:w-[140px] lg:h-9"
                                            >
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua Status
                                                </SelectItem>
                                                <SelectItem value="open">
                                                    Open
                                                </SelectItem>
                                                <SelectItem value="resolved">
                                                    Resolved
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={selectedRootCause}
                                            onValueChange={
                                                handleRootCauseChange
                                            }
                                        >
                                            <SelectTrigger
                                                aria-label="Filter akar masalah"
                                                className="h-11 w-full border-border bg-background text-sm sm:w-[160px] lg:h-9"
                                            >
                                                <SelectValue placeholder="Semua Root Cause" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua Root Cause
                                                </SelectItem>
                                                {Object.entries(
                                                    rootCauseLabels,
                                                ).map(([value, label]) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <label className="flex h-9 items-center gap-2 px-1 text-sm text-muted-foreground">
                                            <Checkbox
                                                checked={overdue}
                                                onCheckedChange={(checked) =>
                                                    handleOverdueChange(
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            Overdue
                                        </label>
                                    </div>
                                </FilterPopover>

                                {hasActiveFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="h-11 self-start text-xs text-muted-foreground hover:text-foreground sm:self-auto lg:h-9"
                                    >
                                        <X className="mr-1 size-3" />
                                        Reset Filter
                                    </Button>
                                )}
                            </div>

                            <Button
                                asChild
                                size="sm"
                                className="h-11 gap-1.5 bg-primary font-medium text-primary-foreground shadow-xs hover:bg-primary-hover lg:h-9"
                            >
                                <Link href="/issues/create">
                                    <Plus className="size-4" />
                                    <span>Catat Issue</span>
                                </Link>
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                            <Table className="min-w-[1040px]">
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Sistem
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Issue
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Prioritas
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Waktu Lapor
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issues.data.length > 0 ? (
                                        issues.data.map((issue) => {
                                            const isOverdue =
                                                issue.status === 'open' &&
                                                new Date(issue.due_date) <
                                                    new Date();

                                            return (
                                                <TableRow
                                                    key={issue.id}
                                                    className="border-border transition-colors hover:bg-muted/30"
                                                >
                                                    <TableCell>
                                                        <div className="flex min-w-0 flex-col">
                                                            <span className="truncate text-sm font-medium text-foreground">
                                                                {issue.project
                                                                    ? issue
                                                                          .project
                                                                          .name
                                                                    : 'Infrastruktur / Umum'}
                                                            </span>
                                                            {issue.project && (
                                                                <span className="truncate text-xs text-muted-foreground capitalize">
                                                                    {issue.project.status.replace(
                                                                        '_',
                                                                        ' ',
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex min-w-0 flex-col gap-0.5">
                                                            <Link
                                                                href={`/issues/${issue.id}`}
                                                                className="line-clamp-1 text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                                                            >
                                                                {issue.title}
                                                            </Link>
                                                            <span className="line-clamp-1 text-xs text-muted-foreground">
                                                                {
                                                                    issue.description
                                                                }
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getPriorityBadge(
                                                            issue.priority,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                        {new Date(
                                                            issue.reported_at,
                                                        ).toLocaleDateString(
                                                            'id-ID',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        issue.status ===
                                                                        'open'
                                                                            ? 'border-warning/20 bg-warning-surface text-warning'
                                                                            : 'border-success/20 bg-success-surface text-success'
                                                                    }
                                                                >
                                                                    {issue.status ===
                                                                    'open'
                                                                        ? 'Open'
                                                                        : 'Resolved'}
                                                                </Badge>
                                                                {isOverdue && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-danger/20 bg-danger-surface px-1.5 py-0 text-xs text-danger"
                                                                    >
                                                                        Overdue
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {issue.status ===
                                                                'resolved' &&
                                                                issue.is_on_time !==
                                                                    null && (
                                                                    <span
                                                                        className={cn(
                                                                            'text-xs font-medium',
                                                                            issue.is_on_time
                                                                                ? 'text-success'
                                                                                : 'text-danger',
                                                                        )}
                                                                    >
                                                                        {issue.is_on_time
                                                                            ? 'Tepat waktu'
                                                                            : 'Terlambat'}
                                                                    </span>
                                                                )}
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Clock className="size-3 text-muted-foreground/70" />
                                                                Target:{' '}
                                                                {new Date(
                                                                    issue.due_date,
                                                                ).toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-11 text-muted-foreground hover:bg-muted hover:text-foreground lg:size-8"
                                                            >
                                                                <Link
                                                                    href={`/issues/${issue.id}`}
                                                                    title="Lihat detail"
                                                                >
                                                                    <Eye className="size-4" />
                                                                    <span className="sr-only">
                                                                        Lihat
                                                                        Detail
                                                                    </span>
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Hapus issue"
                                                                onClick={() =>
                                                                    setIssueToDelete(
                                                                        issue,
                                                                    )
                                                                }
                                                                className="size-11 text-muted-foreground hover:bg-danger-surface hover:text-danger lg:size-8"
                                                            >
                                                                <Trash2 className="size-4" />
                                                                <span className="sr-only">
                                                                    Hapus Issue
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-48 text-center"
                                            >
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-2">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <SearchX className="size-5" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {hasActiveFilter
                                                            ? 'Issue Tidak Ditemukan'
                                                            : 'Belum Ada Issue'}
                                                    </h3>
                                                    <p className="text-center text-xs leading-normal text-muted-foreground">
                                                        {hasActiveFilter
                                                            ? 'Tidak ada issue yang cocok dengan filter saat ini.'
                                                            : 'Klik “Catat Issue” untuk membuat laporan pertama.'}
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

                            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Menampilkan{' '}
                                    <span className="font-medium text-foreground">
                                        {issues.from || 0}–{issues.to || 0}
                                    </span>{' '}
                                    dari total {issues.total} issue
                                </p>

                                {issues.last_page > 1 && (
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
                                                        'h-11 gap-1 px-2.5 text-xs sm:pl-2.5 lg:h-8',
                                                        !prevLink &&
                                                            'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <ChevronLeft className="size-4" />
                                                    <span className="hidden sm:block">
                                                        Sebelumnya
                                                    </span>
                                                </Link>
                                            </PaginationItem>

                                            {issues.links
                                                .slice(1, -1)
                                                .map((link, index) =>
                                                    link.label === '...' ? (
                                                        <PaginationItem
                                                            key={`ellipsis-${index}`}
                                                        >
                                                            <span className="flex size-8 items-center justify-center text-muted-foreground">
                                                                <MoreHorizontal className="size-4" />
                                                            </span>
                                                        </PaginationItem>
                                                    ) : (
                                                        <PaginationItem
                                                            key={link.label}
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
                                                    ),
                                                )}

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
                                                        'h-11 gap-1 px-2.5 text-xs sm:pr-2.5 lg:h-8',
                                                        !nextLink &&
                                                            'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <span className="hidden sm:block">
                                                        Berikutnya
                                                    </span>
                                                    <ChevronRight className="size-4" />
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
            <ConfirmDialog
                open={issueToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setIssueToDelete(null);
                    }
                }}
                title={`Hapus issue "${issueToDelete?.title ?? ''}"?`}
                description="Issue akan dihapus permanen dan tidak dapat dipulihkan."
                confirmText="Hapus Issue"
                variant="danger"
                onConfirm={handleDelete}
            />
        </>
    );
}
