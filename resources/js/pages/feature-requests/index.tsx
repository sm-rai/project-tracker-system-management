import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    CircleDot,
    ClockAlert,
    ListChecks,
    Plus,
    Search,
    Target,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { ProgressBar } from '@/components/projects/progress-bar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { create, index, show } from '@/routes/feature-requests';
import type {
    DeployedProject,
    FeatureRequest,
    PaginatedFeatureRequests,
} from '@/types/feature-request';

interface Props {
    featureRequests: PaginatedFeatureRequests;
    metrics: {
        total: number;
        open: number;
        in_progress: number;
        fulfilled: number;
        overdue: number;
    };
    okr: {
        percentage: number;
        target: number;
        achieved: boolean;
        total: number;
        on_time: number;
        period_start: string;
        period_end: string;
    };
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
    in_progress: 'Dikerjakan',
    fulfilled: 'Terpenuhi',
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

function StatusBadge({ request }: { request: FeatureRequest }) {
    const overdue =
        request.status !== 'fulfilled' &&
        new Date(request.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

    if (overdue) {
        return <Badge variant="destructive">Overdue</Badge>;
    }

    const className =
        request.status === 'fulfilled'
            ? 'border-[#3F7A4A]/25 bg-[#E5F0E5] text-[#3F7A4A]'
            : request.status === 'in_progress'
              ? 'border-[#9C842F]/25 bg-[#F2EACF] text-[#78651f]'
              : 'border-[#2F7C7A]/25 bg-[#DCEDEC] text-[#2F7C7A]';

    return (
        <Badge variant="outline" className={className}>
            {labels[request.status]}
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

export default function Index({
    featureRequests,
    metrics,
    okr,
    filters,
    deployedProjects,
    priorities,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [projectId, setProjectId] = useState(filters.project_id ?? 'all');
    const [priority, setPriority] = useState(filters.priority ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [overdue, setOverdue] = useState(Boolean(filters.overdue));

    const apply = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(
            index({
                query: {
                    search: search || undefined,
                    project_id: projectId === 'all' ? undefined : projectId,
                    priority: priority === 'all' ? undefined : priority,
                    status: status === 'all' ? undefined : status,
                    overdue: overdue ? 1 : undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const reset = () => {
        setSearch('');
        setProjectId('all');
        setPriority('all');
        setStatus('all');
        setOverdue(false);
        router.get(index());
    };

    const summary = [
        { label: 'Total', value: metrics.total, icon: ListChecks },
        { label: 'Open', value: metrics.open, icon: CircleDot },
        { label: 'Dikerjakan', value: metrics.in_progress, icon: Target },
        { label: 'Terpenuhi', value: metrics.fulfilled, icon: CheckCircle2 },
        { label: 'Overdue', value: metrics.overdue, icon: ClockAlert },
    ];

    return (
        <>
            <Head title="Feature Request" />
            <SidebarProvider>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader title="Feature Request" />
                    <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Feature Request
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Pantau pemenuhan kebutuhan sistem
                                    operasional terhadap SLA dan target OKR tim.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href={create()}>
                                    <Plus className="size-4" />
                                    Catat Feature Request
                                </Link>
                            </Button>
                        </div>

                        <Card className="overflow-hidden border-[#E7DFD5] py-0">
                            <div className="grid lg:grid-cols-[1fr_280px]">
                                <CardHeader className="gap-4 px-5 py-5 md:px-6">
                                    <div className="flex items-center gap-2">
                                        <Target className="size-5 text-primary" />
                                        <CardTitle>
                                            OKR 2 · Ketepatan Feature Request
                                        </CardTitle>
                                    </div>
                                    <div>
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                                                    {okr.percentage}%
                                                </p>
                                                <CardDescription className="mt-1">
                                                    {okr.on_time} dari{' '}
                                                    {okr.total} request periode
                                                    ini
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    okr.achieved
                                                        ? 'border-[#3F7A4A]/25 bg-[#E5F0E5] text-[#3F7A4A]'
                                                        : 'border-[#B9772E]/25 bg-[#F6E8D6] text-[#8a571f]'
                                                }
                                            >
                                                {okr.achieved
                                                    ? 'Target tercapai'
                                                    : 'Belum tercapai'}
                                            </Badge>
                                        </div>
                                        <ProgressBar
                                            value={Math.min(
                                                okr.percentage,
                                                100,
                                            )}
                                            size="sm"
                                            showLabel={false}
                                        />
                                    </div>
                                </CardHeader>
                                <div className="flex flex-col justify-center border-t bg-[#FAF7F2] px-5 py-5 lg:border-t-0 lg:border-l">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Target tim
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                                        {okr.target}%
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        Minggu {date(okr.period_start)} –{' '}
                                        {date(okr.period_end)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {summary.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                                >
                                    <item.icon className="size-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="font-semibold tabular-nums">
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Card className="gap-0 py-0">
                            <CardContent className="p-4">
                                <form
                                    onSubmit={apply}
                                    className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_150px_150px_auto]"
                                >
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            aria-label="Cari feature request"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Cari judul atau kebutuhan…"
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select
                                        value={projectId}
                                        onValueChange={setProjectId}
                                    >
                                        <SelectTrigger>
                                            <span className="sr-only">
                                                Filter sistem
                                            </span>
                                            <SelectValue placeholder="Sistem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua sistem
                                            </SelectItem>
                                            {deployedProjects.map((project) => (
                                                <SelectItem
                                                    key={project.id}
                                                    value={String(project.id)}
                                                >
                                                    {project.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={priority}
                                        onValueChange={setPriority}
                                    >
                                        <SelectTrigger>
                                            <span className="sr-only">
                                                Filter prioritas
                                            </span>
                                            <SelectValue placeholder="Prioritas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua prioritas
                                            </SelectItem>
                                            {priorities.map((value) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {labels[value]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger>
                                            <span className="sr-only">
                                                Filter status
                                            </span>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua status
                                            </SelectItem>
                                            {statuses.map((value) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {labels[value]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={
                                                overdue
                                                    ? 'destructive'
                                                    : 'outline'
                                            }
                                            onClick={() =>
                                                setOverdue((value) => !value)
                                            }
                                        >
                                            Overdue
                                        </Button>
                                        <Button type="submit">Terapkan</Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={reset}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="gap-0 overflow-hidden py-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Feature Request</TableHead>
                                        <TableHead>Sistem</TableHead>
                                        <TableHead>Prioritas</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Diterima</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {featureRequests.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-36 text-center text-muted-foreground"
                                            >
                                                Belum ada feature request yang
                                                sesuai filter.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        featureRequests.data.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <div className="max-w-md">
                                                        <Link
                                                            href={show(
                                                                request.id,
                                                            )}
                                                            className="font-medium hover:text-primary"
                                                        >
                                                            {request.title}
                                                        </Link>
                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {
                                                                request.description
                                                            }
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {request.project.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {
                                                            labels[
                                                                request.priority
                                                            ]
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        request={request}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-sm tabular-nums">
                                                    {date(request.requested_at)}
                                                </TableCell>
                                                <TableCell className="text-sm tabular-nums">
                                                    {date(request.due_date)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={show(
                                                                request.id,
                                                            )}
                                                        >
                                                            Detail
                                                            <ArrowRight className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {featureRequests.last_page > 1 && (
                                <div className="flex items-center justify-between border-t px-4 py-3">
                                    <p className="text-xs text-muted-foreground">
                                        Halaman {featureRequests.current_page}{' '}
                                        dari {featureRequests.last_page}
                                    </p>
                                    <div className="flex gap-2">
                                        {featureRequests.links
                                            .filter(
                                                (_, position, links) =>
                                                    position === 0 ||
                                                    position ===
                                                        links.length - 1,
                                            )
                                            .map((link) => (
                                                <Button
                                                    key={link.label}
                                                    asChild={Boolean(link.url)}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                >
                                                    {link.url ? (
                                                        <Link href={link.url}>
                                                            {link.label.includes(
                                                                'Previous',
                                                            )
                                                                ? 'Sebelumnya'
                                                                : 'Berikutnya'}
                                                        </Link>
                                                    ) : (
                                                        <span>
                                                            {link.label.includes(
                                                                'Previous',
                                                            )
                                                                ? 'Sebelumnya'
                                                                : 'Berikutnya'}
                                                        </span>
                                                    )}
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
