import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    FileBarChart,
    History,
    Loader2,
    Plus,
} from 'lucide-react';
import type { CSSProperties, FormEvent } from 'react';

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
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type {
    ReportDefaultPeriod,
    ReportProjectOkrSummary,
    ReportPeriodType,
    ReportSummary,
} from '@/types/report';

interface Props {
    defaultPeriod: ReportDefaultPeriod;
    reports: ReportSummary[];
}

interface GenerateReportForm {
    period_type: ReportPeriodType;
    period_start_date: string;
    period_end_date: string;
}

const periodTypeLabels: Record<ReportPeriodType, string> = {
    weekly_default: 'Minggu berjalan',
    custom_range: 'Rentang tanggal',
};

function percentageTone(value: number, target: number): string {
    return value >= target
        ? 'border-success/20 bg-success-surface text-success'
        : 'border-warning/20 bg-warning-surface text-warning';
}

function projectOkrTone(summary: ReportProjectOkrSummary): string {
    if (summary.evaluable_projects === 0) {
        return 'border-border bg-muted text-muted-foreground';
    }

    return summary.achieved_projects === summary.evaluable_projects
        ? 'border-success/20 bg-success-surface text-success'
        : 'border-warning/20 bg-warning-surface text-warning';
}

function ReportCard({ report }: { report: ReportSummary }) {
    return (
        <Link
            href={report.href}
            className="block rounded-lg border bg-card p-4 transition-colors hover:bg-background-soft"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{report.period_label}</p>
                        <Badge variant="outline">
                            {periodTypeLabels[report.period_type]}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Dibuat {report.generated_at}
                    </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Badge
                    variant="outline"
                    className={projectOkrTone(report.okr.brief_realization)}
                >
                    Brief {report.okr.brief_realization.achieved_projects}/
                    {report.okr.brief_realization.evaluable_projects} target
                </Badge>
                <Badge
                    variant="outline"
                    className={percentageTone(report.okr.issue_on_time, 80)}
                >
                    Issue {report.okr.issue_on_time}%
                </Badge>
                <Badge
                    variant="outline"
                    className={percentageTone(
                        report.okr.feature_request_on_time,
                        90,
                    )}
                >
                    Request {report.okr.feature_request_on_time}%
                </Badge>
            </div>
        </Link>
    );
}

export default function ReportsIndex({ defaultPeriod, reports }: Props) {
    const { data, setData, post, processing, errors } =
        useForm<GenerateReportForm>({
            period_type: 'weekly_default',
            period_start_date: defaultPeriod.start,
            period_end_date: defaultPeriod.end,
        });

    const isCustomRange = data.period_type === 'custom_range';

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/reports');
    };

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
                            <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileBarChart className="size-4" />
                                    <span>Laporan historis untuk review</span>
                                </div>
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                                    Buat laporan dan simpan histori
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Simpan kondisi OKR pada periode terpilih
                                    agar dapat ditinjau kembali, dibandingkan
                                    dengan periode lain, dan diekspor nanti.
                                </p>
                            </div>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Buat Laporan</CardTitle>
                                    <CardDescription>
                                        Pilih periode yang ingin direkap. Hasil
                                        perhitungannya akan disimpan sebagai
                                        snapshot historis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        className="space-y-5"
                                        onSubmit={submit}
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="period_type">
                                                Periode
                                            </Label>
                                            <Select
                                                value={data.period_type}
                                                onValueChange={(value) =>
                                                    setData(
                                                        'period_type',
                                                        value as ReportPeriodType,
                                                    )
                                                }
                                            >
                                                <SelectTrigger id="period_type">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly_default">
                                                        Minggu berjalan
                                                    </SelectItem>
                                                    <SelectItem value="custom_range">
                                                        Rentang tanggal
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.period_type && (
                                                <p className="text-xs text-danger">
                                                    {errors.period_type}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-lg border bg-background-soft p-4">
                                            <div className="flex items-start gap-3">
                                                <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        Periode default
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {defaultPeriod.label}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isCustomRange && (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="period_start_date">
                                                        Tanggal Mulai
                                                    </Label>
                                                    <DatePicker
                                                        id="period_start_date"
                                                        aria-label="Tanggal mulai laporan"
                                                        aria-describedby={
                                                            errors.period_start_date
                                                                ? 'period_start_date-error'
                                                                : undefined
                                                        }
                                                        value={
                                                            data.period_start_date
                                                        }
                                                        onChange={(value) =>
                                                            setData(
                                                                'period_start_date',
                                                                value,
                                                            )
                                                        }
                                                        placeholder="Pilih tanggal mulai"
                                                    />
                                                    {errors.period_start_date && (
                                                        <p
                                                            id="period_start_date-error"
                                                            className="text-xs text-danger"
                                                        >
                                                            {
                                                                errors.period_start_date
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="period_end_date">
                                                        Tanggal Selesai
                                                    </Label>
                                                    <DatePicker
                                                        id="period_end_date"
                                                        aria-label="Tanggal selesai laporan"
                                                        aria-describedby={
                                                            errors.period_end_date
                                                                ? 'period_end_date-error'
                                                                : undefined
                                                        }
                                                        value={
                                                            data.period_end_date
                                                        }
                                                        onChange={(value) =>
                                                            setData(
                                                                'period_end_date',
                                                                value,
                                                            )
                                                        }
                                                        placeholder="Pilih tanggal selesai"
                                                    />
                                                    {errors.period_end_date && (
                                                        <p
                                                            id="period_end_date-error"
                                                            className="text-xs text-danger"
                                                        >
                                                            {
                                                                errors.period_end_date
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Plus className="size-4" />
                                            )}
                                            Buat dan Simpan Laporan
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="size-5 text-primary" />
                                        Histori Laporan
                                    </CardTitle>
                                    <CardDescription>
                                        Buka laporan yang pernah dibuat. Data di
                                        dalam snapshot tetap sama meski data
                                        operasional berubah.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {reports.length === 0 ? (
                                        <div className="rounded-lg border border-dashed bg-background-soft px-5 py-12 text-center">
                                            <FileBarChart className="mx-auto size-7 text-muted-foreground" />
                                            <p className="mt-3 text-sm font-medium">
                                                Belum ada laporan tersimpan
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Buat laporan pertama saat data
                                                periode ini siap ditinjau.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {reports.map((report) => (
                                                <ReportCard
                                                    key={report.id}
                                                    report={report}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
