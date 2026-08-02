import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    MoreHorizontal,
    Plus,
    Search,
    SearchX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
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
import { create, index, show } from '@/routes/feature-requests';
import type {
    DeployedProject,
    FeatureRequest,
    PaginatedFeatureRequests,
} from '@/types/feature-request';

interface Props {
    featureRequests: PaginatedFeatureRequests;
    filters: {
        search?: string;
        project_id?: string;
        priority?: string;
        status?: string;
        overdue?: string | boolean;
    };
    deployedProjects: DeployedProject[];
    priorities: string[];
    statuses: string[];
}

const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'Sedang Dikerjakan',
    fulfilled: 'Terpenuhi',
    urgent: 'Urgent',
    normal: 'Normal',
    low: 'Low',
};

function labelFor(value: string) {
    return labels[value] ?? value.replace('_', ' ');
}

function StatusBadge({ request }: { request: FeatureRequest }) {
    const overdue =
        request.status !== 'fulfilled' &&
        new Date(request.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

    if (overdue) {
        return (
            <Badge
                variant="outline"
                className="border-danger/20 bg-danger-surface text-danger"
            >
                Overdue
            </Badge>
        );
    }

    const className =
        request.status === 'fulfilled'
            ? 'border-success/20 bg-success-surface text-success'
            : request.status === 'in_progress'
              ? 'border-pending/20 bg-pending-surface text-pending'
              : 'border-info/20 bg-info-surface text-info';

    return (
        <Badge variant="outline" className={className}>
            {labelFor(request.status)}
        </Badge>
    );
}

function date(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

export default function FeatureRequestsIndex({
    featureRequests,
    filters,
    deployedProjects,
    priorities,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [projectId, setProjectId] = useState(filters.project_id ?? 'all');
    const [priority, setPriority] = useState(filters.priority ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [overdue, setOverdue] = useState(
        filters.overdue === true || filters.overdue === '1',
    );
    const isFirstRender = useRef(true);

    const applyFilters = (
        searchValue: string,
        projectValue: string,
        priorityValue: string,
        statusValue: string,
        overdueValue: boolean,
    ) => {
        router.get(
            index(),
            {
                search: searchValue || undefined,
                project_id: projectValue === 'all' ? undefined : projectValue,
                priority: priorityValue === 'all' ? undefined : priorityValue,
                status: statusValue === 'all' ? undefined : statusValue,
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
            applyFilters(search, projectId, priority, status, overdue);
        }, 300);

        return () => clearTimeout(timer);
        // Select filters apply immediately; only the free-text search is debounced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleProjectChange = (value: string) => {
        setProjectId(value);
        applyFilters(search, value, priority, status, overdue);
    };

    const handlePriorityChange = (value: string) => {
        setPriority(value);
        applyFilters(search, projectId, value, status, overdue);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        applyFilters(search, projectId, priority, value, overdue);
    };

    const handleOverdueChange = (checked: boolean) => {
        setOverdue(checked);
        applyFilters(search, projectId, priority, status, checked);
    };

    const handleResetFilters = () => {
        setSearch('');
        setProjectId('all');
        setPriority('all');
        setStatus('all');
        setOverdue(false);
        router.get(index(), {}, { preserveState: true, replace: true });
    };

    const hasActiveFilter =
        search.trim() !== '' ||
        projectId !== 'all' ||
        priority !== 'all' ||
        status !== 'all' ||
        overdue;
    const activeAdvancedFilterCount = [
        projectId !== 'all',
        priority !== 'all',
        status !== 'all',
        overdue,
    ].filter(Boolean).length;
    const prevLink = featureRequests.links[0]?.url;
    const nextLink =
        featureRequests.links[featureRequests.links.length - 1]?.url;

    return (
        <>
            <Head title="Feature Request" />
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
                    <SiteHeader title="Feature Request" />
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0">
                        <div className="flex flex-col gap-1 pt-4 md:pt-2">
                            <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                Feature Requests
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Catat, prioritaskan, dan pantau kebutuhan sistem
                                yang sedang berjalan.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                <div className="relative max-w-sm flex-1">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        aria-label="Cari feature request"
                                        placeholder="Cari judul atau kebutuhan..."
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
                                                    projectId,
                                                    priority,
                                                    status,
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
                                            value={projectId}
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
                                            value={priority}
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
                                                {priorities.map((value) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {labelFor(value)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={status}
                                            onValueChange={handleStatusChange}
                                        >
                                            <SelectTrigger
                                                aria-label="Filter status feature request"
                                                className="h-11 w-full border-border bg-background text-sm sm:w-[150px] lg:h-9"
                                            >
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua Status
                                                </SelectItem>
                                                {statuses.map((value) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {labelFor(value)}
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
                                <Link href={create()}>
                                    <Plus className="size-4" />
                                    <span>Tambah Feature Request</span>
                                </Link>
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Feature Request
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Sistem
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Prioritas
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Diterima
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Target
                                        </TableHead>
                                        <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {featureRequests.data.length > 0 ? (
                                        featureRequests.data.map((request) => (
                                            <TableRow
                                                key={request.id}
                                                className="border-border transition-colors hover:bg-muted/30"
                                            >
                                                <TableCell>
                                                    <div className="flex min-w-0 flex-col gap-0.5">
                                                        <Link
                                                            href={show(
                                                                request.id,
                                                            )}
                                                            className="line-clamp-1 text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                                                        >
                                                            {request.title}
                                                        </Link>
                                                        <span className="line-clamp-1 text-xs text-muted-foreground">
                                                            {
                                                                request.description
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {request.project.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {labelFor(
                                                            request.priority,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        request={request}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                    {date(request.requested_at)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                    {date(request.due_date)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-11 text-muted-foreground hover:bg-muted hover:text-foreground lg:size-8"
                                                    >
                                                        <Link
                                                            href={show(
                                                                request.id,
                                                            )}
                                                            title="Lihat detail"
                                                        >
                                                            <Eye className="size-4" />
                                                            <span className="sr-only">
                                                                Lihat Detail
                                                            </span>
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-48 text-center"
                                            >
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-2">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <SearchX className="size-5" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {hasActiveFilter
                                                            ? 'Feature Request Tidak Ditemukan'
                                                            : 'Belum Ada Feature Request'}
                                                    </h3>
                                                    <p className="text-center text-xs leading-normal text-muted-foreground">
                                                        {hasActiveFilter
                                                            ? 'Tidak ada request yang cocok dengan filter saat ini.'
                                                            : 'Klik “Tambah Feature Request” untuk membuat request pertama.'}
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
                                        {featureRequests.from || 0}–
                                        {featureRequests.to || 0}
                                    </span>{' '}
                                    dari total {featureRequests.total} feature
                                    request
                                </p>

                                {featureRequests.last_page > 1 && (
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

                                            {featureRequests.links
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
        </>
    );
}
