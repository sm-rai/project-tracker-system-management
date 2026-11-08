import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    FileDown,
    FolderKanban,
    ImageDown,
} from 'lucide-react';
import { useId, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

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
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { formatAppDateTime } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { index as reportsIndex } from '@/routes/reports';
import { pdf, png } from '@/routes/reports/export';
import type {
    ReportResolvedItem,
    ReportSimplifiedDetail,
} from '@/types/report';

function CompletedItem({
    item,
    completionLabel,
}: {
    item: ReportResolvedItem;
    completionLabel: string;
}) {
    const descriptionId = useId();
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const description = item.description.trim() || 'Belum ada deskripsi.';
    const hasDescription = item.description.trim().length > 0;
    const formattedCompletionTime = formatAppDateTime(item.solved_at);

    return (
        <article className="py-2.5">
            <div className="min-w-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <h3 className="min-w-0 text-base leading-6 font-medium break-words sm:text-h3">
                        {item.title}
                    </h3>
                    <time
                        dateTime={item.solved_at}
                        aria-label={`${completionLabel} ${formattedCompletionTime} WIB`}
                        className="shrink-0 text-muted-foreground tabular-nums text-caption sm:text-right"
                    >
                        {formattedCompletionTime} WIB
                    </time>
                </div>
                <p className="mt-1 text-muted-foreground text-caption">
                    <span className="font-semibold text-foreground">
                        Project:
                    </span>{' '}
                    {item.project_name ?? 'Tanpa project terkait'}
                </p>
                <div className="mt-1.5">
                    <p
                        id={descriptionId}
                        className={cn(
                            isDescriptionExpanded
                                ? 'break-words whitespace-pre-wrap text-muted-foreground text-small'
                                : 'line-clamp-2 break-words whitespace-pre-wrap text-muted-foreground text-small',
                        )}
                    >
                        {description}
                    </p>
                    {hasDescription && (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto min-h-8 gap-1 px-0 py-1 text-xs"
                            aria-expanded={isDescriptionExpanded}
                            aria-controls={descriptionId}
                            onClick={() =>
                                setIsDescriptionExpanded(
                                    (expanded) => !expanded,
                                )
                            }
                        >
                            {isDescriptionExpanded
                                ? 'Ringkas deskripsi'
                                : 'Lihat deskripsi lengkap'}
                            <ChevronDown
                                className={cn(
                                    'size-3 transition-transform',
                                    isDescriptionExpanded && 'rotate-180',
                                )}
                            />
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}

function CompletionCard({
    title,
    count,
    itemLabel,
    items,
    completionLabel,
    emptyTitle,
    emptyDescription,
    icon,
}: {
    title: string;
    count: number;
    itemLabel: string;
    items: ReportResolvedItem[];
    completionLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    icon: ReactNode;
}) {
    return (
        <Card className="min-w-0 gap-2 py-4">
            <CardHeader className="block">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <CardTitle className="flex items-center gap-2 leading-snug font-medium text-h3 sm:font-semibold sm:text-h2">
                        {icon}
                        {title}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-auto tabular-nums">
                        {count} {itemLabel}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <Empty className="gap-3 p-4 md:p-6">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">{icon}</EmptyMedia>
                            <EmptyTitle>{emptyTitle}</EmptyTitle>
                            <EmptyDescription>
                                {emptyDescription}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div>
                        {items.map((item, index) => (
                            <div key={item.id}>
                                {index > 0 && <Separator />}
                                <CompletedItem
                                    item={item}
                                    completionLabel={completionLabel}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ReportSimplifiedShow({
    report,
}: {
    report: ReportSimplifiedDetail;
}) {
    return (
        <>
            <Head title={`Laporan Aktivitas ${report.period.label}`} />
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': 'calc(var(--spacing) * 72)',
                        '--header-height': 'calc(var(--spacing) * 12)',
                    } as CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset className="min-w-0">
                    <SiteHeader title="Laporan Aktivitas" />
                    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
                        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <span>{report.period.label}</span>
                                    <Badge variant="outline">
                                        {report.period.type === 'weekly_default'
                                            ? 'Minggu berjalan'
                                            : 'Rentang tanggal'}
                                    </Badge>
                                </div>
                                <h1 className="mt-3 tracking-tight text-h1">
                                    Laporan Aktivitas
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Ringkasan disimpan saat laporan dibuat pada{' '}
                                    {report.generated_at} WIB.
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Button asChild variant="outline">
                                    <a href={png.url(report.id)}>
                                        <ImageDown data-icon="inline-start" />
                                        Export PNG
                                    </a>
                                </Button>
                                <Button asChild>
                                    <a href={pdf.url(report.id)}>
                                        <FileDown data-icon="inline-start" />
                                        Export PDF
                                    </a>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={reportsIndex()}>
                                        <ArrowLeft data-icon="inline-start" />
                                        Kembali ke Laporan
                                    </Link>
                                </Button>
                            </div>
                        </section>

                        <Card className="gap-4 py-4">
                            <CardHeader>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 leading-snug font-medium text-h3 sm:font-semibold sm:text-h2">
                                        <FolderKanban className="size-5 text-primary" />
                                        Project aktif
                                    </CardTitle>
                                    <Badge variant="secondary">
                                        {report.summary.active_project_count}{' '}
                                        project
                                    </Badge>
                                </div>
                                <CardDescription className="text-small">
                                    Progress berdasarkan Brief Feature yang
                                    selesai saat laporan dibuat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {report.active_projects.length === 0 ? (
                                    <Empty className="gap-3 p-4 md:p-6">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <FolderKanban />
                                            </EmptyMedia>
                                            <EmptyTitle>
                                                Belum ada project aktif
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Project aktif akan muncul di
                                                sini setelah ditambahkan.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : (
                                    <div>
                                        {report.active_projects.map(
                                            (project, index) => (
                                                <div key={project.id}>
                                                    {index > 0 && <Separator />}
                                                    <div className="grid gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(200px,0.65fr)] sm:items-center sm:gap-6">
                                                        <p className="text-base font-medium break-words">
                                                            {project.name}
                                                        </p>
                                                        {project.progress_percentage ===
                                                        null ? (
                                                            <p className="text-sm text-muted-foreground sm:text-right">
                                                                Belum ada Brief
                                                                Feature
                                                            </p>
                                                        ) : (
                                                            <ProgressBar
                                                                value={
                                                                    project.progress_percentage
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <section className="grid gap-4">
                            <CompletionCard
                                title="Issue solved"
                                count={report.summary.resolved_issue_count}
                                itemLabel="Issue"
                                items={report.resolved_issues}
                                completionLabel="Solved"
                                emptyTitle="Belum ada Issue yang solved"
                                emptyDescription="Issue yang selesai pada periode ini akan muncul di sini."
                                icon={
                                    <CheckCircle2 className="size-5 text-primary" />
                                }
                            />
                            <CompletionCard
                                title="Feature Request delivered"
                                count={
                                    report.summary
                                        .fulfilled_feature_request_count
                                }
                                itemLabel="Feature Request"
                                items={report.fulfilled_feature_requests}
                                completionLabel="Delivered"
                                emptyTitle="Belum ada Feature Request yang delivered"
                                emptyDescription="Feature Request yang selesai pada periode ini akan muncul di sini."
                                icon={
                                    <CheckCircle2 className="size-5 text-primary" />
                                }
                            />
                        </section>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
