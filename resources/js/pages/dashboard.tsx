import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import { AppSidebar } from '@/components/app-sidebar';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
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
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type {
    DashboardAttentionItem,
    DashboardData,
    DashboardOkrMetric,
    DashboardProjectOkrMetric,
    DashboardProjectOkrProject,
    DashboardProjectStatusDistribution,
} from '@/types/dashboard';

interface Props {
    dashboard: DashboardData;
}

const okrTone = {
    achieved: 'border-success/20 bg-success-surface text-success',
    attention: 'border-warning/20 bg-warning-surface text-warning',
};

const priorityLabels: Record<DashboardAttentionItem['priority'], string> = {
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

const statusLabels: Record<
    DashboardProjectStatusDistribution['value'],
    string
> = {
    planning: 'Planning',
    in_progress: 'Development',
    on_hold: 'On Hold',
    completed_pending_deployment: 'Pending Deploy',
    deployed_running: 'Running',
    deployed_maintenance: 'Maintenance',
};

const statusColors: Record<
    DashboardProjectStatusDistribution['value'],
    string
> = {
    planning: 'var(--pending)',
    in_progress: 'var(--pending)',
    on_hold: 'var(--warning)',
    completed_pending_deployment: 'var(--pending)',
    deployed_running: 'var(--success)',
    deployed_maintenance: 'var(--info)',
};

const chartConfig = {
    count: {
        label: 'Jumlah sistem',
        color: 'var(--primary)',
    },
} satisfies ChartConfig;

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function percentageWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
}

function metricBasis(metric: DashboardOkrMetric): string {
    if (metric.on_time_items === null) {
        return `${metric.total_items} project aktif`;
    }

    return `${metric.on_time_items} dari ${metric.total_items} item tepat waktu`;
}

function OkrCard({ metric }: { metric: DashboardOkrMetric }) {
    return (
        <Card className="gap-0 border-border bg-card shadow-xs">
            <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardDescription>{metric.label}</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums">
                            {metric.actual}%
                        </CardTitle>
                    </div>
                    <Badge
                        variant="outline"
                        className={
                            metric.achieved
                                ? okrTone.achieved
                                : okrTone.attention
                        }
                    >
                        {metric.achieved
                            ? 'Mencapai target'
                            : 'Perlu perhatian'}
                    </Badge>
                </div>
                <div className="relative h-2">
                    <div className="h-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={
                                metric.achieved
                                    ? 'h-full bg-success'
                                    : 'h-full bg-warning'
                            }
                            style={{ width: percentageWidth(metric.actual) }}
                        />
                    </div>
                    <span
                        aria-hidden="true"
                        className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
                        style={{ left: percentageWidth(metric.target) }}
                        title={`Target ${metric.target}%`}
                    />
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="mt-1 font-medium tabular-nums">
                        {metric.target}%
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">
                        Cakupan data
                    </p>
                    <p className="mt-1 font-medium tabular-nums">
                        {metricBasis(metric)}
                    </p>
                </div>
                {metric.empty_label && (
                    <p className="col-span-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {metric.empty_label}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ProjectOkrRow({
    project,
    target,
}: {
    project: DashboardProjectOkrProject;
    target: number;
}) {
    const realizationPercentage = project.realization_percentage ?? 0;

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/projects/${project.id}`}
                            className="font-medium transition-colors hover:text-primary"
                        >
                            {project.name}
                        </Link>
                        <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {project.brief_features_done} dari{' '}
                        {project.brief_features_total} brief feature selesai
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={
                        project.achieved === true
                            ? okrTone.achieved
                            : project.is_evaluable
                              ? okrTone.attention
                              : 'border-border bg-muted text-muted-foreground'
                    }
                >
                    {project.achieved === true
                        ? 'Target tercapai'
                        : project.is_evaluable
                          ? 'Belum mencapai target'
                          : 'Belum dapat dinilai'}
                </Badge>
            </div>

            {project.is_evaluable ? (
                <div className="mt-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={
                                        project.achieved === true
                                            ? 'h-full rounded-full bg-success transition-all duration-500 ease-out'
                                            : 'h-full rounded-full bg-warning transition-all duration-500 ease-out'
                                    }
                                    style={{
                                        width: percentageWidth(
                                            realizationPercentage,
                                        ),
                                    }}
                                />
                            </div>
                            <span
                                aria-hidden="true"
                                className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
                                style={{ left: percentageWidth(target) }}
                                title={`Target ${target}%`}
                            />
                        </div>
                        <span className="min-w-12 text-right text-sm font-semibold tabular-nums">
                            {project.realization_percentage}%
                        </span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>Realisasi brief</span>
                        <span>Target {target}%</span>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-md border border-dashed bg-background-soft px-3 py-2 text-xs text-muted-foreground">
                    {project.empty_label}
                </div>
            )}
        </div>
    );
}

function ProjectOkrSection({ metric }: { metric: DashboardProjectOkrMetric }) {
    return (
        <Card className="gap-0 border-border bg-card shadow-xs">
            <CardHeader className="gap-3 border-b pb-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                        <CardTitle>{metric.label}</CardTitle>
                        <CardDescription>
                            Setiap project development memiliki target realisasi
                            brief sebesar {metric.target}%.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="self-start">
                        {metric.achieved_projects} dari{' '}
                        {metric.evaluable_projects} project dapat dinilai
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                {metric.projects.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-background-soft px-4 py-8 text-center">
                        <p className="text-sm font-medium">
                            {metric.empty_label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Project akan muncul di sini selama masih berada
                            dalam fase development.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {metric.projects.map((project) => (
                            <ProjectOkrRow
                                key={project.id}
                                project={project}
                                target={metric.target}
                            />
                        ))}
                        {metric.evaluable_projects < metric.total_projects && (
                            <p className="text-xs text-muted-foreground">
                                {metric.total_projects -
                                    metric.evaluable_projects}{' '}
                                project belum dapat dinilai karena belum
                                memiliki brief feature.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AttentionList({
    title,
    description,
    items,
    empty,
    openCount,
    overdueCount,
    href,
}: {
    title: string;
    description: string;
    items: DashboardAttentionItem[];
    empty: string;
    openCount: number;
    overdueCount: number;
    href: string;
}) {
    return (
        <Card className="gap-0">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="size-4 text-warning" />
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                    >
                        <Link href={href}>
                            Lihat semua
                            <ChevronRight className="size-4" />
                        </Link>
                    </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{openCount} terbuka</span>
                    <span aria-hidden="true">·</span>
                    <span>{overdueCount} melewati SLA</span>
                </div>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-background-soft px-4 py-8 text-center">
                        <CheckCircle2 className="mx-auto size-6 text-success" />
                        <p className="mt-2 text-sm font-medium">{empty}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Tidak ada pekerjaan yang melewati SLA saat dashboard
                            ini dibuka.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg border">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-background-soft"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {item.project_name} · target{' '}
                                        {formatDate(item.due_date)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-danger/25 bg-danger-surface text-danger"
                                    >
                                        {item.days_overdue} hari
                                    </Badge>
                                    <Badge variant="outline">
                                        {priorityLabels[item.priority]}
                                    </Badge>
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ dashboard }: Props) {
    const statusData = dashboard.projectStatusDistribution.map((item) => ({
        ...item,
        shortLabel: statusLabels[item.value],
    }));

    const okrMetrics = [
        dashboard.okr.issue_on_time,
        dashboard.okr.feature_request_on_time,
    ];

    return (
        <>
            <Head title="Dashboard" />
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
                    <SiteHeader title="Dashboard" />
                    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <CalendarDays className="size-4" />
                                    <span>Minggu {dashboard.period.label}</span>
                                    <span className="hidden md:inline">-</span>
                                    <span>
                                        Terakhir dibuka{' '}
                                        {dashboard.period.generated_at}
                                    </span>
                                </div>
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                                    Ringkasan OKR dan Operasional
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Metrik OKR mengikuti periode minggu ini,
                                    sedangkan status Issue, Feature Request, dan
                                    sistem menunjukkan kondisi saat ini.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline">
                                    <Link href="/projects">Lihat Project</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/issues">Lihat Issue</Link>
                                </Button>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            <ProjectOkrSection
                                metric={dashboard.okr.brief_realization}
                            />
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                            {okrMetrics.map((metric) => (
                                <OkrCard key={metric.key} metric={metric} />
                            ))}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                            <AttentionList
                                title="Issue yang Perlu Ditangani"
                                description="Issue aktif yang paling lama melewati batas waktu SLA."
                                items={dashboard.attention.issues}
                                empty="Tidak ada issue yang melewati SLA"
                                openCount={dashboard.operational.open_issues}
                                overdueCount={
                                    dashboard.operational.overdue_issues
                                }
                                href="/issues"
                            />
                            <AttentionList
                                title="Feature Request yang Perlu Ditangani"
                                description="Feature Request aktif yang paling lama melewati batas waktu SLA."
                                items={dashboard.attention.feature_requests}
                                empty="Tidak ada Feature Request yang melewati SLA"
                                openCount={
                                    dashboard.operational.open_feature_requests
                                }
                                overdueCount={
                                    dashboard.operational
                                        .overdue_feature_requests
                                }
                                href="/feature-requests"
                            />
                        </section>

                        <section className="grid min-w-0 gap-4">
                            <Card className="min-w-0">
                                <CardHeader>
                                    <CardTitle>Status Project</CardTitle>
                                    <CardDescription>
                                        Distribusi terkini project dari Planning
                                        hingga sistem yang sudah Running,
                                        termasuk project dalam Maintenance.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="min-w-0 overflow-hidden">
                                    <ChartContainer
                                        config={chartConfig}
                                        className="h-[280px] w-full min-w-0"
                                    >
                                        <BarChart
                                            data={statusData}
                                            margin={{
                                                top: 10,
                                                right: 8,
                                                bottom: 8,
                                                left: 0,
                                            }}
                                        >
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="shortLabel"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                interval={0}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tickLine={false}
                                                axisLine={false}
                                                width={28}
                                            />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent />
                                                }
                                            />
                                            <Bar
                                                dataKey="count"
                                                radius={[6, 6, 0, 0]}
                                            >
                                                {statusData.map((entry) => (
                                                    <Cell
                                                        key={entry.value}
                                                        fill={
                                                            statusColors[
                                                                entry.value
                                                            ]
                                                        }
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </section>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
