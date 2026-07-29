import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircle2,
    Eye,
    Plus,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        if (confirm('Apakah Anda yakin ingin menghapus data issue ini?')) {
            router.delete(`/issues/${id}`);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge className="bg-red-600 hover:bg-red-700 text-white font-medium">Urgent</Badge>;
            case 'normal':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">Normal</Badge>;
            case 'low':
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">Low</Badge>;
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
            <Head title="Pencatatan Issue System" />
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
                    <SiteHeader title="Manajemen Issue" />
                    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                        {/* Header & Title */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Pencatatan Issue
                                </h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Kelola dan pantau daftar issue teknis pada sistem yang telah berjalan di produksi.
                                </p>
                            </div>
                            <Button asChild className="gap-2 shrink-0">
                                <Link href="/issues/create">
                                    <Plus className="h-4 w-4" />
                                    Tambah Issue Baru
                                </Link>
                            </Button>
                        </div>

                        {/* Compact Search & Filters Bar */}
                        <Card className="shadow-xs border bg-card">
                            <CardContent className="px-3.5 py-2.5 md:px-4 md:py-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Search Input */}
                                    <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Cari judul atau deskripsi issue..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-9 h-9 text-sm"
                                            />
                                        </div>
                                        <Button type="submit" variant="secondary" size="sm" className="h-9 px-3">
                                            Cari
                                        </Button>
                                    </form>

                                    {/* Project Filter */}
                                    <div className="w-full sm:w-[220px]">
                                        <Select
                                            value={selectedProject}
                                            onValueChange={(val) => {
                                                setSelectedProject(val);
                                                handleFilterChange('project_id', val);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Semua Sistem / Project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Sistem / Project</SelectItem>
                                                <SelectItem value="unattached">Umum / Infrastruktur</SelectItem>
                                                {deployedProjects.map((proj) => (
                                                    <SelectItem key={proj.id} value={proj.id.toString()}>
                                                        {proj.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Priority Filter */}
                                    <div className="w-full sm:w-[150px]">
                                        <Select
                                            value={selectedPriority}
                                            onValueChange={(val) => {
                                                setSelectedPriority(val);
                                                handleFilterChange('priority', val);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Semua Prioritas" />
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
                                    <div className="w-full sm:w-[140px]">
                                        <Select
                                            value={selectedStatus}
                                            onValueChange={(val) => {
                                                setSelectedStatus(val);
                                                handleFilterChange('status', val);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Animated Reset Filters Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Reset Filter"
                                        onClick={() => router.get('/issues')}
                                        className="group h-9 w-9 shrink-0 ml-auto sm:ml-0 hover:bg-muted"
                                    >
                                        <RefreshCw className="h-4 w-4 transition-transform duration-500 ease-in-out group-hover:rotate-180 group-active:rotate-360 text-muted-foreground group-hover:text-foreground" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Table */}
                        <Card className="shadow-xs border bg-card overflow-hidden">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="font-semibold">Judul Issue & Sistem</TableHead>
                                            <TableHead className="font-semibold">Prioritas</TableHead>
                                            <TableHead className="font-semibold">Kategori Penyebab</TableHead>
                                            <TableHead className="font-semibold">Waktu Lapor</TableHead>
                                            <TableHead className="font-semibold">Tenggat Waktu</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="text-right font-semibold">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {issues.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-40 text-center">
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5 py-4">
                                                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/50 stroke-[1.5]" />
                                                        <span className="text-sm font-medium">Belum ada data issue yang tercatat.</span>
                                                        <span className="text-xs text-muted-foreground/70">
                                                            Klik &ldquo;Tambah Issue Baru&rdquo; untuk mencatat issue pertama.
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            issues.data.map((issue) => {
                                                const isOverdue =
                                                    issue.status === 'open' &&
                                                    new Date(issue.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

                                                return (
                                                    <TableRow key={issue.id} className="hover:bg-muted/30 transition-colors">
                                                        <TableCell className="py-3">
                                                            <div className="flex flex-col">
                                                                <Link
                                                                    href={`/issues/${issue.id}`}
                                                                    className="font-medium text-foreground hover:underline hover:text-primary transition-colors"
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
                                                        <TableCell className="py-3">{getPriorityBadge(issue.priority)}</TableCell>
                                                        <TableCell className="py-3">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {getRootCauseLabel(issue.root_cause_category)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-xs text-muted-foreground">
                                                            {new Date(issue.reported_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="py-3 text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-medium">
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
                                                        <TableCell className="py-3">
                                                            {issue.status === 'open' ? (
                                                                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50/60 dark:bg-amber-950/20 font-medium">
                                                                    Open
                                                                </Badge>
                                                            ) : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <Badge className="bg-emerald-600 text-white w-fit font-medium">
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
                                                        <TableCell className="py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Detail">
                                                                    <Link href={`/issues/${issue.id}`}>
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Hapus"
                                                                    onClick={() => handleDelete(issue.id)}
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                            <div className="flex justify-center pt-2">
                                <Pagination links={issues.links} />
                            </div>
                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
