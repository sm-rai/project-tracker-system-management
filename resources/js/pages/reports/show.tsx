import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileBarChart,
    FileDown,
    FolderKanban,
    ImageDown,
    ListChecks,
    Target,
} from 'lucide-react';
import type { CSSProperties } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
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
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {
    ReportDetail,
    ReportFeatureRequestItem,
    ReportIssueItem,
    ReportOkrMetric,
    ReportProjectOkrSummary,
    ReportProjectItem,
} from '@/types/report';

interface Props {
    report: ReportDetail;
}

const labels: Record<string, string> = {
    open: 'Open',
    resolved: 'Resolved',
    in_progress: 'Sedang Dikerjakan',
    fulfilled: 'Terpenuhi',
    urgent: 'Urgent',
    normal: 'Normal',
    low: 'Low',
    system_error: 'System Error',
    non_system: 'Non-system',
    other: 'Other',
};

function percentageWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
}

function dateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function metricBasis(metric: ReportOkrMetric): string {
    if (metric.total_items === 0) {
        return metric.empty_label ?? 'Tidak ada data baru pada periode ini.';
    }

    if (metric.on_time_items === null) {
        return `${metric.total_items} active project`;
    }

    return `${metric.on_time_items} dari ${metric.total_items} item tepat waktu`;
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'resolved':
        case 'fulfilled':
            return 'border-success/20 bg-success-surface text-success';
        case 'in_progress':
            return 'border-pending/20 bg-pending-surface text-pending';
        case 'open':
            return 'border-info/20 bg-info-surface text-info';
        default:
            return 'border-neutral/20 bg-neutral-surface text-neutral';
    }
}

function OkrCard({ metric }: { metric: ReportOkrMetric }) {
    const isEmpty = metric.total_items === 0;

    return (
        <Card>
            <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardDescription>{metric.label}</CardDescription>
                        <CardTitle className="mt-1 text-3xl font-semibold tabular-nums">
                            {metric.actual}%
                        </CardTitle>
                    </div>
                    <Badge
                        variant="outline"
                        className={
                            isEmpty
                                ? 'border-muted-foreground/20 bg-muted text-muted-foreground'
                                : metric.achieved
                                  ? 'border-success/20 bg-success-surface text-success'
                                  : 'border-warning/20 bg-warning-surface text-warning'
                        }
                    >
                        {isEmpty
                            ? (metric.empty_label ?? 'Tidak ada data baru')
                            : metric.achieved
                              ? 'Mencapai target'
                              : 'Perlu perhatian'}
                    </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className={
                            isEmpty
                                ? 'h-full bg-muted-foreground/40'
                                : metric.achieved
                                  ? 'h-full bg-success'
                                  : 'h-full bg-warning'
                        }
                        style={{ width: percentageWidth(metric.actual) }}
                    />
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="mt-1 font-medium">{metric.target}%</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">
                        Dasar perhitungan
                    </p>
                    <p className="mt-1 font-medium">{metricBasis(metric)}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function ProjectOkrCard({
    metric,
}: {
    metric: ReportProjectOkrSummary & {
        key: 'brief_realization';
        label: string;
    };
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{metric.label}</CardTitle>
                <CardDescription>
                    Setiap project development dinilai secara individual dengan
                    target {metric.target}%.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-background-soft p-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Project mencapai target
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums">
                            {metric.achieved_projects}/
                            {metric.evaluable_projects}
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className={
                            metric.evaluable_projects === 0
                                ? 'border-border bg-muted text-muted-foreground'
                                : metric.achieved_projects ===
                                    metric.evaluable_projects
                                  ? 'border-success/20 bg-success-surface text-success'
                                  : 'border-warning/20 bg-warning-surface text-warning'
                        }
                    >
                        {metric.evaluable_projects === 0
                            ? 'Belum dapat dinilai'
                            : `${metric.achieved_projects} project tercapai`}
                    </Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    {metric.total_projects} project aktif dalam fase
                    development; project tanpa brief tidak dimasukkan ke
                    penilaian.
                </p>
            </CardContent>
        </Card>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof FolderKanban;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="rounded-md bg-background-soft p-2">
                <Icon className="size-4 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold tabular-nums">{value}</p>
            </div>
        </div>
    );
}

function ProjectRows({ projects }: { projects: ReportProjectItem[] }) {
    if (projects.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-background-soft px-4 py-8 text-center text-sm text-muted-foreground">
                Tidak ada data project saat snapshot ini dibuat.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead className="text-right">Hasil OKR 1</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {projects.map((project) => (
                    <TableRow key={project.id}>
                        <TableCell className="font-medium">
                            {project.name}
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={
                                    project.is_active_development
                                        ? 'border-pending/20 bg-pending-surface text-pending'
                                        : 'border-success/20 bg-success-surface text-success'
                                }
                            >
                                {project.status_label}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {project.is_active_development ? (
                                project.is_evaluable ? (
                                    <>
                                        {project.brief_features_done}/
                                        {project.brief_features_total} (
                                        {project.realization_percentage}%)
                                    </>
                                ) : (
                                    <Badge variant="secondary">
                                        Belum ada brief
                                    </Badge>
                                )
                            ) : (
                                <span className="text-muted-foreground">
                                    Di luar radar
                                </span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            {project.is_active_development ? (
                                project.is_evaluable ? (
                                    <Badge
                                        variant="outline"
                                        className={
                                            project.achieved
                                                ? 'border-success/20 bg-success-surface text-success'
                                                : 'border-warning/20 bg-warning-surface text-warning'
                                        }
                                    >
                                        {project.achieved
                                            ? 'Tercapai'
                                            : 'Belum tercapai'}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">
                                        Belum dapat dinilai
                                    </Badge>
                                )
                            ) : (
                                <Badge variant="outline">
                                    Selesai / deployed
                                </Badge>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function IssueRows({
    issues,
    emptyLabel,
}: {
    issues: ReportIssueItem[];
    emptyLabel: string | null;
}) {
    if (issues.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-background-soft px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyLabel ?? 'Tidak ada issue baru pada periode ini.'}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Batas Waktu</TableHead>
                    <TableHead className="text-right">SLA</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {issues.map((issue) => (
                    <TableRow key={issue.id}>
                        <TableCell className="font-medium">
                            {issue.title}
                        </TableCell>
                        <TableCell>{issue.project_name}</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={statusBadgeClass(issue.status)}
                            >
                                {labels[issue.status]}
                            </Badge>
                        </TableCell>
                        <TableCell>{dateTime(issue.due_date)}</TableCell>
                        <TableCell className="text-right">
                            {issue.is_on_time === true ? (
                                <Badge className="bg-success text-success-foreground">
                                    Tepat waktu
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="border-warning/20 bg-warning-surface text-warning"
                                >
                                    Open / terlambat
                                </Badge>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function FeatureRequestRows({
    requests,
    emptyLabel,
}: {
    requests: ReportFeatureRequestItem[];
    emptyLabel: string | null;
}) {
    if (requests.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-background-soft px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyLabel ??
                    'Tidak ada Feature Request baru pada periode ini.'}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Batas Waktu</TableHead>
                    <TableHead className="text-right">SLA</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((request) => (
                    <TableRow key={request.id}>
                        <TableCell className="font-medium">
                            {request.title}
                        </TableCell>
                        <TableCell>{request.project_name}</TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={statusBadgeClass(request.status)}
                            >
                                {labels[request.status]}
                            </Badge>
                        </TableCell>
                        <TableCell>{dateTime(request.due_date)}</TableCell>
                        <TableCell className="text-right">
                            {request.is_on_time === true ? (
                                <Badge className="bg-success text-success-foreground">
                                    Tepat waktu
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="border-warning/20 bg-warning-surface text-warning"
                                >
                                    Open / terlambat
                                </Badge>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function ReportShow({ report }: Props) {
    const okrMetrics = [
        report.okr.issue_on_time,
        report.okr.feature_request_on_time,
    ];

    return (
        <>
            <Head title={`Laporan OKR ${report.period.label}`} />
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
                            <div>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <FileBarChart className="size-4" />
                                    <span>{report.period.label}</span>
                                    <span>-</span>
                                    <span>Dibuat {report.generated_at}</span>
                                </div>
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                                    Snapshot Laporan
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Ini adalah kondisi OKR yang disimpan untuk
                                    periode ini. Perubahan data setelah snapshot
                                    dibuat tidak mengubah laporan ini.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button asChild variant="outline">
                                    <a
                                        href={`/reports/${report.id}/export/png`}
                                    >
                                        <ImageDown className="size-4" />
                                        Export PNG
                                    </a>
                                </Button>
                                <Button asChild>
                                    <a
                                        href={`/reports/${report.id}/export/pdf`}
                                    >
                                        <FileDown className="size-4" />
                                        Export PDF
                                    </a>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/reports">
                                        <ArrowLeft className="size-4" />
                                        Kembali ke Laporan
                                    </Link>
                                </Button>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            <ProjectOkrCard
                                metric={report.okr.brief_realization}
                            />
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                            {okrMetrics.map((metric) => (
                                <OkrCard key={metric.key} metric={metric} />
                            ))}
                        </section>

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                icon={FolderKanban}
                                label="Total Project"
                                value={report.breakdowns.projects.total}
                            />
                            <StatCard
                                icon={Target}
                                label="Project Aktif"
                                value={report.breakdowns.projects.active_total}
                            />
                            <StatCard
                                icon={ListChecks}
                                label="Issue pada periode"
                                value={report.breakdowns.issues.total}
                            />
                            <StatCard
                                icon={Clock}
                                label="Feature Request pada periode"
                                value={report.breakdowns.feature_requests.total}
                            />
                        </section>

                        <Card>
                            <CardHeader>
                                <CardTitle>Realisasi Project</CardTitle>
                                <CardDescription>
                                    Active project dalam fase development
                                    dihitung untuk OKR 1. Sistem yang sudah
                                    deployed tetap ditampilkan sebagai konteks.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <ProjectRows
                                    projects={
                                        report.breakdowns.projects.projects
                                    }
                                />
                            </CardContent>
                        </Card>

                        <section className="grid gap-4 xl:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ListChecks className="size-5 text-primary" />
                                        Issues
                                    </CardTitle>
                                    <CardDescription>
                                        {report.breakdowns.issues.total === 0
                                            ? (report.breakdowns.issues
                                                  .empty_label ??
                                              'Tidak ada issue baru pada periode ini.')
                                            : `${report.breakdowns.issues.on_time} dari ${report.breakdowns.issues.total} issue selesai tepat waktu.`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <IssueRows
                                        issues={report.breakdowns.issues.items}
                                        emptyLabel={
                                            report.breakdowns.issues.empty_label
                                        }
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="size-5 text-primary" />
                                        Feature Requests
                                    </CardTitle>
                                    <CardDescription>
                                        {report.breakdowns.feature_requests
                                            .total === 0
                                            ? (report.breakdowns
                                                  .feature_requests
                                                  .empty_label ??
                                              'Tidak ada Feature Request baru pada periode ini.')
                                            : `${report.breakdowns.feature_requests.on_time} dari ${report.breakdowns.feature_requests.total} Feature Request terpenuhi tepat waktu.`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <FeatureRequestRows
                                        requests={
                                            report.breakdowns.feature_requests
                                                .items
                                        }
                                        emptyLabel={
                                            report.breakdowns.feature_requests
                                                .empty_label
                                        }
                                    />
                                </CardContent>
                            </Card>
                        </section>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
