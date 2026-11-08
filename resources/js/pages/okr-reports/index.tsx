import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    CalendarDays,
    CircleDot,
    FolderKanban,
    Lightbulb,
} from 'lucide-react';
import type { CSSProperties } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAppDateTime } from '@/lib/datetime';
import { index as okrReportsIndex } from '@/routes/okr-reports';
import type { ProjectStatusType } from '@/types/project';

interface PeriodOption {
    year: number;
    quarter: number;
    value: string;
    label: string;
}

interface Metric {
    label: string;
    actual: number;
    target: number;
    achieved: boolean;
    total_items: number;
    on_time_items: number;
    empty_label: string | null;
}

interface BriefFeatureDetail {
    id: number;
    name: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done' | 'not_done';
    status_label: string;
    created_at: string | null;
    completed_at: string | null;
}

interface ProjectDetail {
    id: number;
    name: string;
    status: ProjectStatusType;
    status_label: string;
    brief_features_total: number;
    brief_features_done: number;
    realization_percentage: number | null;
    target_percentage: number;
    is_evaluable: boolean;
    achieved: boolean | null;
    empty_label: string | null;
    href: string;
    brief_features: BriefFeatureDetail[];
}

interface WorkItem {
    id: number;
    title: string;
    description: string | null;
    project_name: string;
    priority: 'urgent' | 'normal' | 'low';
    due_date: string | null;
    status: string;
    status_at_period_end: string;
    is_on_time: boolean | null;
    href: string;
}

interface IssueItem extends WorkItem {
    reported_at: string;
    resolved_at: string | null;
    root_cause_category: string;
    resolution_note: string | null;
}

interface FeatureRequestItem extends WorkItem {
    requested_at: string;
    fulfilled_at: string | null;
    fulfillment_note: string | null;
}

interface WorkItemActivity {
    label: string;
    date: string | null;
}

interface WorkItemReportRow {
    item: WorkItem;
    activities: WorkItemActivity[];
}

interface OkrReport {
    period: {
        year: number;
        quarter: number;
        start: string;
        end: string;
        label: string;
        is_current: boolean;
        generated_at: string;
    };
    okr: {
        brief_realization: {
            label: string;
            target: number;
            total_projects: number;
            evaluable_projects: number;
            achieved_projects: number;
            projects: Array<Omit<ProjectDetail, 'brief_features'>>;
            empty_label: string | null;
        };
        issue_on_time: Metric;
        feature_request_on_time: Metric;
    };
    details: {
        projects: ProjectDetail[];
        issues: IssueItem[];
        issue_resolutions: IssueItem[];
        feature_requests: FeatureRequestItem[];
        feature_request_fulfillments: FeatureRequestItem[];
    };
}

interface Props {
    report: OkrReport;
    periodOptions: PeriodOption[];
}

const priorityLabels: Record<WorkItem['priority'], string> = {
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

const featureStatusTone: Record<BriefFeatureDetail['status'], string> = {
    todo: 'border-border bg-muted text-muted-foreground',
    not_done: 'border-border bg-muted text-muted-foreground',
    in_progress: 'border-pending/30 bg-pending-surface text-pending',
    done: 'border-success/30 bg-success-surface text-success',
};

function metricTone(achieved: boolean): string {
    return achieved
        ? 'border-success/20 bg-success-surface text-success'
        : 'border-warning/20 bg-warning-surface text-warning';
}

function progressWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
}

function MetricCard({
    title,
    value,
    target,
    achieved,
    basis,
    emptyLabel,
}: {
    title: string;
    value: string;
    target: string;
    achieved: boolean;
    basis: string;
    emptyLabel?: string | null;
}) {
    return (
        <Card className="gap-0 border-border bg-card shadow-xs">
            <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardDescription>{title}</CardDescription>
                        <CardTitle className="text-3xl font-semibold tabular-nums">
                            {value}
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className={metricTone(achieved)}>
                        {achieved ? 'Mencapai target' : 'Perlu perhatian'}
                    </Badge>
                </div>
                <div
                    role="progressbar"
                    aria-label={`Capaian ${title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number.parseFloat(value) || 0}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                >
                    <div
                        className={
                            achieved
                                ? 'h-full rounded-full bg-success transition-[width] duration-500 ease-out'
                                : 'h-full rounded-full bg-warning transition-[width] duration-500 ease-out'
                        }
                        style={{
                            width: progressWidth(Number.parseFloat(value) || 0),
                        }}
                    />
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="mt-1 font-medium tabular-nums">{target}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Cakupan</p>
                    <p className="mt-1 font-medium tabular-nums">{basis}</p>
                </div>
                {emptyLabel && (
                    <p className="col-span-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {emptyLabel}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ProjectBriefList({ projects }: { projects: ProjectDetail[] }) {
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <FolderKanban className="size-7 text-muted-foreground" />
                <p className="font-medium">
                    Belum ada project untuk kuartal ini
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                    Project yang berjalan dan Brief Feature-nya akan tampil di
                    sini.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y">
            {projects.map((project) => {
                const realization = project.realization_percentage ?? 0;

                return (
                    <section
                        key={project.id}
                        className="space-y-4 py-5 first:pt-0 last:pb-0"
                    >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link
                                        href={project.href}
                                        className="font-semibold underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                                    >
                                        {project.name}
                                    </Link>
                                    <ProjectStatusBadge
                                        status={project.status}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {project.brief_features_done} dari{' '}
                                    {project.brief_features_total} Brief Feature
                                    selesai
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    project.achieved === null
                                        ? 'border-border bg-muted text-muted-foreground'
                                        : project.achieved
                                          ? 'border-success/20 bg-success-surface text-success'
                                          : 'border-warning/20 bg-warning-surface text-warning'
                                }
                            >
                                {project.is_evaluable
                                    ? `${realization}% dari target ${project.target_percentage}%`
                                    : 'Belum ada Brief Feature'}
                            </Badge>
                        </div>
                        <div
                            role="progressbar"
                            aria-label={`Realisasi Brief Feature ${project.name}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={realization}
                            className="h-2 overflow-hidden rounded-full bg-muted"
                        >
                            <div
                                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                                style={{ width: progressWidth(realization) }}
                            />
                        </div>
                        {project.brief_features.length > 0 ? (
                            <ul className="grid gap-x-6 sm:grid-cols-2">
                                {project.brief_features.map((brief) => (
                                    <li
                                        key={brief.id}
                                        className="flex min-w-0 items-start justify-between gap-3 border-t py-3 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {brief.name}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {brief.completed_at
                                                    ? `Selesai ${formatAppDateTime(brief.completed_at)}`
                                                    : brief.created_at
                                                      ? `Dibuat ${formatAppDateTime(brief.created_at)}`
                                                      : 'Belum ada tanggal'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={
                                                featureStatusTone[brief.status]
                                            }
                                        >
                                            {brief.status_label}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {project.empty_label}
                            </p>
                        )}
                    </section>
                );
            })}
        </div>
    );
}

function mergeWorkItemActivities<T extends WorkItem>(
    reportedItems: T[],
    completedItems: T[],
    reportedLabel: string,
    getReportedDate: (item: T) => string,
    completedLabel: string,
    getCompletedDate: (item: T) => string | null,
): WorkItemReportRow[] {
    const rows = new Map<number, WorkItemReportRow>();

    reportedItems.forEach((item) => {
        rows.set(item.id, {
            item,
            activities: [{ label: reportedLabel, date: getReportedDate(item) }],
        });
    });

    completedItems.forEach((item) => {
        const activity = {
            label: completedLabel,
            date: getCompletedDate(item),
        };
        const row = rows.get(item.id);

        if (row) {
            row.activities.push(activity);

            return;
        }

        rows.set(item.id, { item, activities: [activity] });
    });

    return Array.from(rows.values())
        .map((row) => ({
            ...row,
            activities: [...row.activities].sort(
                (first, second) =>
                    (first.date ? Date.parse(first.date) : 0) -
                    (second.date ? Date.parse(second.date) : 0),
            ),
        }))
        .sort((first, second) => {
            const firstDate = Math.max(
                ...first.activities.map((activity) =>
                    activity.date ? Date.parse(activity.date) : 0,
                ),
            );
            const secondDate = Math.max(
                ...second.activities.map((activity) =>
                    activity.date ? Date.parse(activity.date) : 0,
                ),
            );

            return secondDate - firstDate || first.item.id - second.item.id;
        });
}

function WorkItemsTable({
    rows,
    itemType,
    emptyLabel,
}: {
    rows: WorkItemReportRow[];
    itemType: 'issue' | 'feature-request';
    emptyLabel: string;
}) {
    if (rows.length === 0) {
        return (
            <p className="rounded-md bg-muted/60 px-4 py-5 text-sm text-muted-foreground">
                {emptyLabel}
            </p>
        );
    }

    return (
        <Table className="min-w-[800px]">
            <TableCaption className="sr-only">
                {itemType === 'issue'
                    ? 'Rincian issue pada kuartal terpilih'
                    : 'Rincian Feature Request pada kuartal terpilih'}
            </TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[34%]">Rincian</TableHead>
                    <TableHead className="w-[18%]">Project</TableHead>
                    <TableHead className="w-[28%]">Aktivitas kuartal</TableHead>
                    <TableHead className="w-[20%]">Status & SLA</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map(({ item, activities }) => {
                    const isComplete =
                        item.status_at_period_end === 'resolved' ||
                        item.status_at_period_end === 'fulfilled';
                    let statusLabel = 'Terbuka';

                    if (item.status_at_period_end === 'fulfilled') {
                        statusLabel = 'Dipenuhi';
                    } else if (item.status_at_period_end === 'resolved') {
                        statusLabel = 'Selesai';
                    } else if (
                        itemType === 'feature-request' &&
                        item.status_at_period_end === 'in_progress'
                    ) {
                        statusLabel = 'Dalam proses';
                    }

                    return (
                        <TableRow key={item.id}>
                            <TableCell className="whitespace-normal">
                                <div className="min-w-[180px] space-y-1">
                                    <div className="flex items-start gap-1.5">
                                        <Link
                                            href={item.href}
                                            className="font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                                        >
                                            {item.title}
                                        </Link>
                                        <ArrowUpRight
                                            aria-hidden="true"
                                            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                                        />
                                    </div>
                                    {item.description && (
                                        <p className="line-clamp-1 max-w-sm text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm whitespace-normal">
                                {item.project_name}
                            </TableCell>
                            <TableCell className="whitespace-normal">
                                <div className="flex flex-col gap-1.5">
                                    {activities.map((activity, index) => (
                                        <div
                                            key={`${activity.label}-${index}`}
                                            className="flex flex-wrap items-center gap-x-2 text-xs"
                                        >
                                            <span className="font-medium">
                                                {activity.label}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {activity.date
                                                    ? formatAppDateTime(
                                                          activity.date,
                                                      )
                                                    : 'Tanggal tidak tersedia'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="whitespace-normal">
                                <div className="flex min-w-[150px] flex-col items-start gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className={
                                            isComplete
                                                ? 'border-success/20 bg-success-surface text-success'
                                                : 'border-border bg-muted text-muted-foreground'
                                        }
                                    >
                                        {statusLabel}
                                    </Badge>
                                    <p className="flex flex-wrap items-center gap-x-1 text-xs">
                                        <span>
                                            {priorityLabels[item.priority]}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="text-muted-foreground"
                                        >
                                            ·
                                        </span>
                                        <span
                                            className={
                                                item.is_on_time === null
                                                    ? 'text-muted-foreground'
                                                    : item.is_on_time
                                                      ? 'text-success'
                                                      : 'text-warning'
                                            }
                                        >
                                            {item.is_on_time === null
                                                ? 'SLA belum dinilai'
                                                : item.is_on_time
                                                  ? 'SLA tepat waktu'
                                                  : 'SLA terlambat'}
                                        </span>
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default function OkrReportsIndex({ report, periodOptions }: Props) {
    const currentPeriodValue = `${report.period.year}-${report.period.quarter}`;

    const changePeriod = (value: string) => {
        const [year, quarter] = value.split('-').map(Number);

        router.get(
            okrReportsIndex(),
            { year, quarter },
            { preserveScroll: true, preserveState: true },
        );
    };

    const projectMetric = report.okr.brief_realization;
    const issueMetric = report.okr.issue_on_time;
    const featureRequestMetric = report.okr.feature_request_on_time;
    const issueRows = mergeWorkItemActivities(
        report.details.issues,
        report.details.issue_resolutions,
        'Dilaporkan',
        (item) => item.reported_at,
        'Diselesaikan',
        (item) => item.resolved_at,
    );
    const featureRequestRows = mergeWorkItemActivities(
        report.details.feature_requests,
        report.details.feature_request_fulfillments,
        'Diajukan',
        (item) => item.requested_at,
        'Dipenuhi',
        (item) => item.fulfilled_at,
    );

    return (
        <>
            <Head title="Laporan OKR" />
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
                    <SiteHeader title="Laporan OKR" />
                    <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                    Laporan OKR
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Capaian dan rincian pekerjaan pada setiap
                                    kuartal.
                                </p>
                            </div>
                            <div className="grid gap-2 sm:w-64">
                                <label
                                    htmlFor="okr-period"
                                    className="text-sm font-medium"
                                >
                                    Periode kuartal
                                </label>
                                <Select
                                    value={currentPeriodValue}
                                    onValueChange={changePeriod}
                                >
                                    <SelectTrigger id="okr-period">
                                        <CalendarDays className="size-4 text-muted-foreground" />
                                        <SelectValue placeholder="Pilih kuartal" />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        {periodOptions.map((period) => (
                                            <SelectItem
                                                key={period.value}
                                                value={period.value}
                                            >
                                                {period.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </section>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <CircleDot className="size-4 shrink-0 text-primary" />
                                <p className="truncate text-sm font-medium">
                                    {report.period.label}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Diperbarui {report.period.generated_at}
                            </p>
                        </div>

                        <section
                            aria-label="Ringkasan capaian OKR"
                            className="grid gap-4 xl:grid-cols-3"
                        >
                            <Card className="gap-0 border-border bg-card shadow-xs">
                                <CardHeader className="space-y-3 pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <CardDescription>
                                                Realisasi Brief Feature
                                            </CardDescription>
                                            <CardTitle className="text-3xl font-semibold tabular-nums">
                                                {
                                                    projectMetric.achieved_projects
                                                }
                                                /
                                                {
                                                    projectMetric.evaluable_projects
                                                }
                                            </CardTitle>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="border-primary/20 bg-primary-surface text-primary"
                                        >
                                            {projectMetric.total_projects}{' '}
                                            project
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="border-t pt-4 text-sm">
                                    <p className="font-medium">
                                        Target minimal {projectMetric.target}%
                                        per project
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Project memenuhi target dari project
                                        yang memiliki Brief Feature.
                                    </p>
                                    {projectMetric.empty_label && (
                                        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                            {projectMetric.empty_label}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                            <MetricCard
                                title="Issue selesai tepat waktu"
                                value={`${issueMetric.actual}%`}
                                target={`${issueMetric.target}%`}
                                achieved={issueMetric.achieved}
                                basis={`${issueMetric.on_time_items} dari ${issueMetric.total_items} issue`}
                                emptyLabel={issueMetric.empty_label}
                            />
                            <MetricCard
                                title="Feature Request tepat waktu"
                                value={`${featureRequestMetric.actual}%`}
                                target={`${featureRequestMetric.target}%`}
                                achieved={featureRequestMetric.achieved}
                                basis={`${featureRequestMetric.on_time_items} dari ${featureRequestMetric.total_items} request`}
                                emptyLabel={featureRequestMetric.empty_label}
                            />
                        </section>

                        <Tabs defaultValue="projects" className="gap-4">
                            <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
                                <TabsTrigger value="projects" className="gap-2">
                                    <FolderKanban className="size-4" />
                                    <span>Project & Brief</span>
                                </TabsTrigger>
                                <TabsTrigger value="issues" className="gap-2">
                                    <AlertCircle className="size-4" />
                                    <span>Issue</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="feature-requests"
                                    className="gap-2"
                                >
                                    <Lightbulb className="size-4" />
                                    <span>Feature Request</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="projects" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Project & Brief Feature
                                        </CardTitle>
                                        <CardDescription>
                                            Persentase penyelesaian Brief
                                            Feature dan rincian setiap project
                                            pada akhir kuartal.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ProjectBriefList
                                            projects={report.details.projects}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="issues" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Rincian Issue</CardTitle>
                                        <CardDescription>
                                            Issue yang dilaporkan atau
                                            diselesaikan pada kuartal ini.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <WorkItemsTable
                                            rows={issueRows}
                                            itemType="issue"
                                            emptyLabel="Tidak ada Issue yang dilaporkan atau diselesaikan pada kuartal ini."
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent
                                value="feature-requests"
                                className="mt-0"
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Rincian Feature Request
                                        </CardTitle>
                                        <CardDescription>
                                            Request yang diajukan atau dipenuhi
                                            pada kuartal ini.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <WorkItemsTable
                                            rows={featureRequestRows}
                                            itemType="feature-request"
                                            emptyLabel="Tidak ada Feature Request yang diajukan atau dipenuhi pada kuartal ini."
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
