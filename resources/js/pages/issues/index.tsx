import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    Filter,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
} from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
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
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface IssuesIndexProps {
    issues: PaginatedData<Issue>;
    metrics: {
        total: number;
        open: number;
        resolved: number;
        overdue: number;
        on_time_percentage: number;
    };
    filters: {
        search?: string;
        project_id?: string;
        priority?: string;
        status?: string;
        root_cause_category?: string;
        overdue?: boolean;
    };
    deployedProjects: Project[];
}

export default function IssuesIndexPage({
    issues,
    metrics,
    filters,
    deployedProjects,
}: IssuesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProject, setSelectedProject] = useState(filters.project_id || 'all');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedRootCause, setSelectedRootCause] = useState(filters.root_cause_category || 'all');

    const handleFilterChange = (key: string, value: string) => {
        const queryParams = {
            search,
            project_id: selectedProject,
            priority: selectedPriority,
            status: selectedStatus,
            root_cause_category: selectedRootCause,
            [key]: value,
        };

        // Clean up default 'all'
        Object.keys(queryParams).forEach((k) => {
            if (queryParams[k as keyof typeof queryParams] === 'all' || !queryParams[k as keyof typeof queryParams]) {
                delete queryParams[k as keyof typeof queryParams];
            }
        });

        router.get('/issues', queryParams, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', search);
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus issue ini?')) {
            router.delete(`/issues/${id}`);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge className="bg-red-600 hover:bg-red-700 text-white">Urgent</Badge>;
            case 'normal':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Normal</Badge>;
            case 'low':
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Low</Badge>;
            default:
                return <Badge variant="outline">{priority}</Badge>;
        }
    };

    const getRootCauseLabel = (category: string) => {
        switch (category) {
            case 'system_error':
                return 'System Error';
            case 'non_system':
                return 'Non-System';
            case 'other':
                return 'Lainnya';
            default:
                return category;
        }
    };

    return (
        <>
            <Head title="Manajemen Issue (Kendala)" />
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
                    <SiteHeader title="Kendala System (Issues)" />
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        {/* Header & Title */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Pencatatan Kendala (Issues)
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Kelola kendala sistem berstatus *deployed* dan lacak pencapaian SLA (OKR 2).
                                </p>
                            </div>
                            <Button asChild className="gap-2">
                                <Link href="/issues/create">
                                    <Plus className="h-4 w-4" />
                                    Tambah Issue
                                </Link>
                            </Button>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Issue</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.total}</div>
                                    <p className="text-xs text-muted-foreground">Tercatat di sistem</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Issue Open</CardTitle>
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-amber-600">{metrics.open}</div>
                                    <p className="text-xs text-muted-foreground">Sedang ditangani</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Overdue (Terlewat SLA)</CardTitle>
                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
                                    <p className="text-xs text-muted-foreground">Melewati due date</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Capain SLA (OKR 2)</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {metrics.on_time_percentage}%
                                    </div>
                                    <p className="text-xs text-muted-foreground">Penyelesaian tepat waktu</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search & Filters Bar */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="grid gap-3 md:grid-cols-12">
                                    {/* Search Input */}
                                    <form onSubmit={handleSearchSubmit} className="md:col-span-4 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Cari judul / deskripsi issue..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Button type="submit" variant="secondary" size="sm">
                                            Cari
                                        </Button>
                                    </form>

                                    {/* Project Filter */}
                                    <div className="md:col-span-3">
                                        <Select
                                            value={selectedProject}
                                            onValueChange={(val) => {
                                                setSelectedProject(val);
                                                handleFilterChange('project_id', val);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Filter System" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua System / Project</SelectItem>
                                                <SelectItem value="unattached">Umum / Infrastruktur (Tanpa System)</SelectItem>
                                                {deployedProjects.map((proj) => (
                                                    <SelectItem key={proj.id} value={proj.id.toString()}>
                                                        {proj.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Priority Filter */}
                                    <div className="md:col-span-2">
                                        <Select
                                            value={selectedPriority}
                                            onValueChange={(val) => {
                                                setSelectedPriority(val);
                                                handleFilterChange('priority', val);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Prioritas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Prioritas</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="md:col-span-2">
                                        <Select
                                            value={selectedStatus}
                                            onValueChange={(val) => {
                                                setSelectedStatus(val);
                                                handleFilterChange('status', val);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Reset Filters */}
                                    <div className="md:col-span-1 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Reset Filter"
                                            onClick={() => router.get('/issues')}
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Table */}
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Judul Issue & System</TableHead>
                                            <TableHead>Prioritas</TableHead>
                                            <TableHead>Root Cause</TableHead>
                                            <TableHead>Waktu Lapor</TableHead>
                                            <TableHead>Tenggat (Due Date)</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {issues.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                                    Belum ada data issue yang tercatat.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            issues.data.map((issue, idx) => {
                                                const isOverdue =
                                                    issue.status === 'open' &&
                                                    new Date(issue.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

                                                return (
                                                    <TableRow key={issue.id}>
                                                        <TableCell className="font-medium text-muted-foreground">
                                                            {(issues.current_page - 1) * issues.per_page + idx + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <Link
                                                                    href={`/issues/${issue.id}`}
                                                                    className="font-semibold hover:underline"
                                                                >
                                                                    {issue.title}
                                                                </Link>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {issue.project
                                                                        ? issue.project.name
                                                                        : 'Umum / Infrastruktur'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                                                        <TableCell>
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {getRootCauseLabel(issue.root_cause_category)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {new Date(issue.reported_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <span>
                                                                    {new Date(issue.due_date).toLocaleDateString('id-ID', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    })}
                                                                </span>
                                                                {isOverdue && (
                                                                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                                                                        Overdue
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {issue.status === 'open' ? (
                                                                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
                                                                    Open
                                                                </Badge>
                                                            ) : (
                                                                <div className="flex flex-col gap-1">
                                                                    <Badge className="bg-emerald-600 text-white w-fit">
                                                                        Resolved
                                                                    </Badge>
                                                                    {issue.is_on_time !== null && (
                                                                        <span className={`text-[10px] font-semibold ${issue.is_on_time ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {issue.is_on_time ? '✓ On-Time' : '⚠ Late'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button asChild variant="ghost" size="icon" title="Detail">
                                                                    <Link href={`/issues/${issue.id}`}>
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Hapus"
                                                                    onClick={() => handleDelete(issue.id)}
                                                                    className="text-red-500 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {issues.total > issues.per_page && (
                            <div className="flex justify-center">
                                <Pagination links={issues.links} />
                            </div>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
