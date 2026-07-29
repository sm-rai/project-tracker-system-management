import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Edit,
    RotateCcw,
    ShieldAlert,
    Trash2,
} from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function IssueShowPage({ issue }: IssueShowProps) {
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

    const { data, setData, patch, processing } = useForm({
        resolution_note: issue.resolution_note || '',
    });

    const handleResolveSubmit = (e: FormEvent) => {
        e.preventDefault();
        patch(`/issues/${issue.id}/resolve`, {
            onSuccess: () => setResolveDialogOpen(false),
        });
    };

    const handleReopen = () => {
        if (confirm('Apakah Anda yakin ingin membuka kembali issue ini?')) {
            router.patch(`/issues/${issue.id}/reopen`);
        }
    };

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus issue ini?')) {
            router.delete(`/issues/${issue.id}`);
        }
    };

    const isOverdue =
        issue.status === 'open' &&
        new Date(issue.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

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
                return 'System Error / Bug Software';
            case 'non_system':
                return 'Non-System / User Error / Process';
            case 'other':
                return 'Lainnya / Infrastruktur';
            default:
                return category;
        }
    };

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
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        {/* Back & Actions Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Button asChild variant="outline" size="icon">
                                    <Link href="/issues">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">
                                        Issue #{issue.id}: {issue.title}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Sistem:{' '}
                                        <span className="font-semibold text-foreground">
                                            {issue.project ? issue.project.name : 'Umum / Infrastruktur'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {issue.status === 'open' ? (
                                    <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Tandai Selesai (Resolve)
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <form onSubmit={handleResolveSubmit}>
                                                <DialogHeader>
                                                    <DialogTitle>Tandai Issue Selesai</DialogTitle>
                                                    <DialogDescription>
                                                        Masukkan catatan solusi/penyelesaian untuk isu ini (opsional).
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 space-y-2">
                                                    <Textarea
                                                        rows={4}
                                                        placeholder="Catatan penanganan atau solusi perbaikan..."
                                                        value={data.resolution_note}
                                                        onChange={(e) => setData('resolution_note', e.target.value)}
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setResolveDialogOpen(false)}
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                                        onClick={handleReopen}
                                        className="gap-2 text-amber-600 border-amber-500 hover:bg-amber-50"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Buka Kembali (Re-open)
                                    </Button>
                                )}

                                <Button asChild variant="outline" size="icon" title="Edit">
                                    <Link href={`/issues/${issue.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    title="Hapus"
                                    onClick={handleDelete}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Status Alert Banners */}
                        {isOverdue && (
                            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-950 dark:bg-red-950/30 dark:text-red-200">
                                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm">Status Overdue!</h4>
                                    <p className="text-xs text-red-700 dark:text-red-300">
                                        Pengatasan isu ini telah melewati tenggat waktu SLA (
                                        {new Date(issue.due_date).toLocaleDateString('id-ID')}).
                                    </p>
                                </div>
                            </div>
                        )}

                        {issue.status === 'resolved' && (
                            <div
                                className={`flex items-center gap-3 rounded-lg border p-4 ${
                                    issue.is_on_time
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200'
                                        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-200'
                                }`}
                            >
                                <CheckCircle2
                                    className={`h-5 w-5 shrink-0 ${
                                        issue.is_on_time ? 'text-emerald-600' : 'text-amber-600'
                                    }`}
                                />
                                <div>
                                    <h4 className="font-bold text-sm">
                                        Issue Resolved {issue.is_on_time ? '(On-Time)' : '(Terlambat / Late)'}
                                    </h4>
                                    <p className="text-xs">
                                        Diselesaikan pada{' '}
                                        {issue.resolved_at
                                            ? new Date(issue.resolved_at).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : '-'}{' '}
                                        — {issue.is_on_time ? 'Memenuhi SLA target.' : 'Melewati SLA target.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Details Cards */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Deskripsi Kendala</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                        {issue.description}
                                    </div>

                                    {issue.resolution_note && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                                Catatan Solusi / Penyelesaian:
                                            </h4>
                                            <p className="rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-sm text-emerald-950 dark:text-emerald-200 border border-emerald-200">
                                                {issue.resolution_note}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Metadeta SLA & Timeline</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between items-center py-1 border-b">
                                        <span className="text-muted-foreground">Prioritas SLA</span>
                                        {getPriorityBadge(issue.priority)}
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b">
                                        <span className="text-muted-foreground">Root Cause</span>
                                        <span className="font-medium">
                                            {getRootCauseLabel(issue.root_cause_category)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b">
                                        <span className="text-muted-foreground">Waktu Lapor</span>
                                        <span className="font-medium text-xs">
                                            {new Date(issue.reported_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b">
                                        <span className="text-muted-foreground">Tenggat (Due Date)</span>
                                        <span className="font-semibold text-xs text-amber-600 dark:text-amber-400">
                                            {new Date(issue.due_date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b">
                                        <span className="text-muted-foreground">Status Issue</span>
                                        {issue.status === 'open' ? (
                                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                                                Open
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-emerald-600 text-white">Resolved</Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
