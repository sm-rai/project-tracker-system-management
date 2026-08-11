import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    Edit,
    RotateCcw,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

import {
    destroy,
    edit,
    index as issuesIndex,
    reopen,
    resolve,
} from '@/actions/App/Http/Controllers/IssueController';
import { AppSidebar } from '@/components/app-sidebar';
import { ConfirmDialog } from '@/components/confirm-dialog';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

interface IssueShowProps {
    issue: Issue;
}

const priorityLabels: Record<string, string> = {
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

const rootCauseLabels: Record<string, string> = {
    system_error: 'Kesalahan sistem atau aplikasi',
    non_system: 'Proses operasional atau penggunaan',
    other: 'Infrastruktur atau belum diketahui',
};

const issueStatusLabels: Record<Issue['status'], string> = {
    open: 'Terbuka',
    resolved: 'Selesai',
};

const projectStatusLabels: Record<string, string> = {
    deployed_running: 'Berjalan',
    deployed_maintenance: 'Dalam pemeliharaan',
};

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function DetailRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-4 border-b border-border py-3 last:border-b-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-right text-sm leading-5 font-medium text-foreground">
                {children}
            </dd>
        </div>
    );
}

export default function IssueShowPage({ issue }: IssueShowProps) {
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [reopenConfirmOpen, setReopenConfirmOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        resolved_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        resolution_note: issue.resolution_note || '',
    });

    const handleResolveSubmit = (e: FormEvent) => {
        e.preventDefault();
        patch(resolve.url(issue.id), {
            preserveScroll: true,
            onSuccess: () => setResolveDialogOpen(false),
        });
    };

    const handleReopen = () => {
        router.patch(
            reopen.url(issue.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setReopenConfirmOpen(false),
            },
        );
    };

    const handleDelete = () => {
        router.delete(destroy.url(issue.id), {
            onFinish: () => setDeleteConfirmOpen(false),
        });
    };

    const isOverdue =
        issue.status === 'open' && new Date(issue.due_date) < new Date();

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return (
                    <Badge
                        variant="outline"
                        className="border-danger/30 bg-danger-surface text-danger"
                    >
                        {priorityLabels[priority]}
                    </Badge>
                );
            case 'normal':
                return (
                    <Badge
                        variant="outline"
                        className="border-warning/30 bg-warning-surface text-warning"
                    >
                        {priorityLabels[priority]}
                    </Badge>
                );
            case 'low':
                return (
                    <Badge
                        variant="outline"
                        className="border-info/30 bg-info-surface text-info"
                    >
                        {priorityLabels[priority]}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline">
                        {priorityLabels[priority] || priority}
                    </Badge>
                );
        }
    };

    const getRootCauseLabel = (category: string) =>
        rootCauseLabels[category] || category;

    const projectStatusLabel = issue.project
        ? projectStatusLabels[issue.project.status] || 'Status tidak diketahui'
        : null;

    return (
        <>
            <Head title={`Detail Issue #${issue.id}`} />
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
                    <SiteHeader title={`Detail Issue #${issue.id}`} />
                    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="icon"
                                    className="size-11 shrink-0 lg:size-9"
                                >
                                    <Link href={issuesIndex.url()}>
                                        <span className="sr-only">
                                            Kembali ke daftar issue
                                        </span>
                                        <ArrowLeft className="size-4" />
                                    </Link>
                                </Button>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                                        Issue #{issue.id}: {issue.title}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">
                                            Sistem
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {issue.project
                                                ? issue.project.name
                                                : 'Issue umum'}
                                        </span>
                                        {projectStatusLabel ? (
                                            <Badge
                                                variant="outline"
                                                className={
                                                    issue.project?.status ===
                                                    'deployed_running'
                                                        ? 'border-success/30 bg-success-surface text-success'
                                                        : 'border-info/30 bg-info-surface text-info'
                                                }
                                            >
                                                Status: {projectStatusLabel}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-border bg-muted text-muted-foreground"
                                            >
                                                Tidak terkait sistem
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                                {issue.status === 'open' ? (
                                    <Dialog
                                        open={resolveDialogOpen}
                                        onOpenChange={setResolveDialogOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button className="h-11 gap-2 bg-success text-success-foreground hover:bg-success/90 lg:h-9">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Selesaikan Issue
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <form
                                                onSubmit={handleResolveSubmit}
                                            >
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Tandai Issue Selesai
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Tambahkan catatan solusi
                                                        atau penanganan untuk
                                                        issue ini (opsional).
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="resolved_at">
                                                            Waktu selesai
                                                        </Label>
                                                        <DateTimePicker
                                                            id="resolved_at"
                                                            value={
                                                                data.resolved_at
                                                            }
                                                            onChange={(value) =>
                                                                setData(
                                                                    'resolved_at',
                                                                    value,
                                                                )
                                                            }
                                                            minDate={
                                                                new Date(
                                                                    issue.reported_at,
                                                                )
                                                            }
                                                            maxDate={new Date()}
                                                            aria-invalid={Boolean(
                                                                errors.resolved_at,
                                                            )}
                                                            aria-describedby={
                                                                errors.resolved_at
                                                                    ? 'resolved_at-error'
                                                                    : 'resolved_at-help'
                                                            }
                                                        />
                                                        <p
                                                            id="resolved_at-help"
                                                            className="text-xs leading-relaxed text-muted-foreground"
                                                        >
                                                            Isi waktu sebenarnya
                                                            saat issue selesai.
                                                            Waktu harus berada
                                                            setelah waktu
                                                            laporan dan tidak
                                                            boleh melewati waktu
                                                            sekarang.
                                                        </p>
                                                        {errors.resolved_at && (
                                                            <p
                                                                id="resolved_at-error"
                                                                className="text-xs font-medium text-danger"
                                                            >
                                                                {
                                                                    errors.resolved_at
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Catatan penanganan atau solusi perbaikan..."
                                                        value={
                                                            data.resolution_note
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'resolution_note',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setResolveDialogOpen(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="bg-success text-success-foreground hover:bg-success/90"
                                                    >
                                                        Simpan & Selesaikan
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setReopenConfirmOpen(true)
                                        }
                                        className="h-11 gap-2 border-warning/30 text-warning hover:bg-warning-surface lg:h-9"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Buka Kembali Issue
                                    </Button>
                                )}

                                <Button
                                    asChild
                                    variant="outline"
                                    size="icon"
                                    aria-label="Edit issue"
                                    className="size-11 lg:size-9"
                                >
                                    <Link href={edit.url(issue.id)}>
                                        <span className="sr-only">
                                            Edit issue
                                        </span>
                                        <Edit className="size-4" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Hapus issue"
                                    onClick={() => setDeleteConfirmOpen(true)}
                                    className="size-11 text-danger hover:bg-danger-surface hover:text-danger lg:size-9"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>

                        {isOverdue && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-lg border border-danger/25 bg-danger-surface p-4 text-danger"
                            >
                                <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold">
                                        Issue melewati target SLA
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed">
                                        Penanganan issue ini melewati batas
                                        waktu pada{' '}
                                        {formatDateTime(issue.due_date)}.
                                    </p>
                                </div>
                            </div>
                        )}

                        {issue.status === 'resolved' && (
                            <div
                                role="status"
                                className={`flex items-center gap-3 rounded-lg border p-4 ${
                                    issue.is_on_time
                                        ? 'border-success/25 bg-success-surface text-success'
                                        : 'border-warning/25 bg-warning-surface text-warning'
                                }`}
                            >
                                <CheckCircle2
                                    className={`size-5 shrink-0 ${
                                        issue.is_on_time
                                            ? 'text-success'
                                            : 'text-warning'
                                    }`}
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold">
                                        Issue selesai{' '}
                                        {issue.is_on_time
                                            ? '· Tepat waktu'
                                            : '· Terlambat'}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed">
                                        Diselesaikan pada{' '}
                                        {issue.resolved_at
                                            ? formatDateTime(issue.resolved_at)
                                            : '-'}{' '}
                                        —{' '}
                                        {issue.is_on_time
                                            ? 'Memenuhi SLA target.'
                                            : 'Melewati SLA target.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b px-5 py-5 md:px-6">
                                    <CardTitle>Deskripsi issue</CardTitle>
                                    <CardDescription>
                                        Kronologi dan dampak yang dilaporkan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 px-5 py-5 md:px-6 md:py-6">
                                    <div className="max-w-3xl rounded-lg bg-muted/50 p-4 text-sm leading-7 whitespace-pre-wrap">
                                        {issue.description || (
                                            <span className="text-muted-foreground italic">
                                                Belum ada deskripsi issue.
                                            </span>
                                        )}
                                    </div>

                                    {issue.resolution_note && (
                                        <div className="rounded-lg border border-success/25 bg-success-surface/70 p-4 text-success">
                                            <p className="text-xs font-semibold">
                                                Catatan penyelesaian
                                            </p>
                                            <p className="mt-1 text-sm leading-7 whitespace-pre-wrap">
                                                {issue.resolution_note}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b px-5 py-5">
                                    <CardTitle>
                                        Status &amp; target SLA
                                    </CardTitle>
                                    <CardDescription>
                                        Klasifikasi dan waktu penanganan issue.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 py-2">
                                    <dl>
                                        <DetailRow label="Status">
                                            {issue.status === 'open' ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-warning/30 bg-warning-surface text-warning"
                                                >
                                                    {issueStatusLabels.open}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-success/30 bg-success-surface text-success"
                                                >
                                                    {issueStatusLabels.resolved}
                                                </Badge>
                                            )}
                                        </DetailRow>
                                        <DetailRow label="Prioritas">
                                            {getPriorityBadge(issue.priority)}
                                        </DetailRow>
                                        <DetailRow label="Dugaan penyebab">
                                            {getRootCauseLabel(
                                                issue.root_cause_category,
                                            )}
                                        </DetailRow>
                                        <DetailRow label="Dilaporkan">
                                            <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
                                                <CalendarClock className="size-3.5 text-muted-foreground" />
                                                {formatDateTime(
                                                    issue.reported_at,
                                                )}
                                            </span>
                                        </DetailRow>
                                        <DetailRow label="Batas waktu">
                                            <span
                                                className={
                                                    isOverdue
                                                        ? 'font-semibold text-danger'
                                                        : 'font-semibold text-warning'
                                                }
                                            >
                                                {formatDateTime(issue.due_date)}
                                            </span>
                                        </DetailRow>
                                        {issue.resolved_at && (
                                            <DetailRow label="Diselesaikan">
                                                <span className="tabular-nums">
                                                    {formatDateTime(
                                                        issue.resolved_at,
                                                    )}
                                                </span>
                                            </DetailRow>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
            <ConfirmDialog
                open={reopenConfirmOpen}
                onOpenChange={setReopenConfirmOpen}
                title="Buka kembali issue ini?"
                description="Issue akan kembali berstatus terbuka dan masuk ke pemantauan SLA aktif."
                confirmText="Buka Kembali"
                variant="warning"
                onConfirm={handleReopen}
            />
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={`Hapus issue "${issue.title}"?`}
                description="Issue akan dihapus permanen dan tidak dapat dipulihkan."
                confirmText="Hapus Issue"
                variant="danger"
                onConfirm={handleDelete}
            />
        </>
    );
}
