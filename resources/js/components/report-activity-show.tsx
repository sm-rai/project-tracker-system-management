import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileDown, ImageDown } from 'lucide-react';
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
import { formatAppDateOnly, formatAppDateTime } from '@/lib/datetime';
import { index as reportsIndex } from '@/routes/reports';
import { pdf, png } from '@/routes/reports/export';
import type { ReportActivity, ReportActivityDetail } from '@/types/report';

const entityLabels: Record<ReportActivity['entity_type'], string> = {
    project: 'Project',
    brief_feature: 'Brief Feature',
    issue: 'Issue',
    feature_request: 'Feature Request',
};
const priorityLabels: Record<string, string> = {
    urgent: 'Urgent',
    normal: 'Normal',
    low: 'Low',
};

function activityDate(value: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? formatAppDateOnly(value)
        : formatAppDateTime(value);
}

export function ReportActivityShow({
    report,
}: {
    report: ReportActivityDetail;
}) {
    const summary = report.activity_summary;

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
                    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
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
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                                    Laporan Aktivitas
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Aktivitas hingga laporan dibuat pada{' '}
                                    {report.generated_at} WIB. Data tersimpan
                                    tetap sama ketika data operasional berubah.
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
                        <Card className="min-w-0">
                            <CardHeader>
                                <CardTitle>Ringkasan aktivitas</CardTitle>
                                <CardDescription>
                                    Satu item dapat memiliki aktivitas baru dan
                                    penyelesaian pada periode yang sama.
                                </CardDescription>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Badge variant="secondary">
                                        {summary.total_activities} aktivitas
                                    </Badge>
                                    <Badge variant="outline">
                                        {summary.unique_items} item unik
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="min-w-0">
                                <Table className="min-w-[560px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jenis item</TableHead>
                                            <TableHead className="text-right">
                                                Baru
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Selesai
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Aktivitas
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Item unik
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.groups.map((group) => (
                                            <TableRow key={group.entity_type}>
                                                <TableCell className="font-medium">
                                                    {group.label}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {group.new_items}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {group.completed_items}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {group.total_activities}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {group.unique_items}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="min-w-0">
                            <CardHeader>
                                <CardTitle>Rincian aktivitas</CardTitle>
                                <CardDescription>
                                    Waktu dalam WIB. Penyelesaian development
                                    project dicatat sebagai tanggal tanpa jam.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="min-w-0">
                                {report.activities.length === 0 ? (
                                    <CardDescription className="py-10 text-center">
                                        Tidak ada aktivitas pada periode ini.
                                    </CardDescription>
                                ) : (
                                    <Table className="min-w-[900px] table-fixed">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[21%]">
                                                    Aktivitas / waktu
                                                </TableHead>
                                                <TableHead className="w-[35%]">
                                                    Item / catatan
                                                </TableHead>
                                                <TableHead className="w-[22%]">
                                                    Project terkait
                                                </TableHead>
                                                <TableHead className="w-[22%]">
                                                    Status / konteks
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.activities.map(
                                                (activity) => (
                                                    <TableRow
                                                        key={`${activity.entity_type}:${activity.entity_id}:${activity.activity_type}`}
                                                    >
                                                        <TableCell className="align-top whitespace-normal">
                                                            <p className="font-medium">
                                                                {
                                                                    activity.activity_label
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {activityDate(
                                                                    activity.occurred_at,
                                                                )}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell className="align-top whitespace-normal">
                                                            <p className="font-medium wrap-anywhere">
                                                                {activity.title}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {
                                                                    entityLabels[
                                                                        activity
                                                                            .entity_type
                                                                    ]
                                                                }
                                                            </p>
                                                            {activity.note && (
                                                                <p className="mt-3 text-sm wrap-anywhere whitespace-pre-wrap text-muted-foreground">
                                                                    {
                                                                        activity.note
                                                                    }
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="align-top wrap-anywhere whitespace-normal">
                                                            {activity.project_name ??
                                                                'Tanpa project terkait'}
                                                        </TableCell>
                                                        <TableCell className="align-top whitespace-normal">
                                                            <Badge
                                                                variant="outline"
                                                                className="max-w-full whitespace-normal"
                                                            >
                                                                {
                                                                    activity.status_label
                                                                }
                                                            </Badge>
                                                            {activity.priority && (
                                                                <p className="mt-2 text-xs text-muted-foreground">
                                                                    Prioritas:{' '}
                                                                    {priorityLabels[
                                                                        activity
                                                                            .priority
                                                                    ] ??
                                                                        activity.priority}
                                                                </p>
                                                            )}
                                                            {activity.due_date && (
                                                                <p className="mt-2 text-xs text-muted-foreground">
                                                                    Batas waktu:{' '}
                                                                    {activityDate(
                                                                        activity.due_date,
                                                                    )}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
