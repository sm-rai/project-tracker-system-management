import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    ClockAlert,
    Pencil,
    Play,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import {
    destroy,
    fulfill,
    reopen,
    start,
} from '@/actions/App/Http/Controllers/FeatureRequestController';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { edit, index } from '@/routes/feature-requests';
import type { FeatureRequest } from '@/types/feature-request';

interface Props {
    featureRequest: FeatureRequest;
    can: { delete: boolean };
}

const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'Dikerjakan',
    fulfilled: 'Terpenuhi',
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

function fullDate(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function Show({ featureRequest, can }: Props) {
    const [fulfillOpen, setFulfillOpen] = useState(false);
    const fulfillForm = useForm({ fulfillment_note: '' });
    const overdue =
        featureRequest.status !== 'fulfilled' &&
        new Date(featureRequest.due_date) <
            new Date(new Date().setHours(0, 0, 0, 0));

    const submitFulfillment = () => {
        fulfillForm.patch(fulfill.url(featureRequest.id), {
            preserveScroll: true,
            onSuccess: () => {
                setFulfillOpen(false);
                fulfillForm.reset();
            },
        });
    };

    const remove = () => {
        if (
            window.confirm(
                'Hapus feature request ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
            )
        ) {
            router.delete(destroy.url(featureRequest.id));
        }
    };

    return (
        <>
            <Head title={featureRequest.title} />
            <SidebarProvider>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader title="Feature Request" />
                    <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div className="flex items-start gap-3">
                                <Button asChild variant="outline" size="icon">
                                    <Link href={index()}>
                                        <span className="sr-only">
                                            Kembali ke daftar Feature Request
                                        </span>
                                        <ArrowLeft className="size-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline">
                                            {labels[featureRequest.status]}
                                        </Badge>
                                        {overdue && (
                                            <Badge variant="destructive">
                                                Overdue
                                            </Badge>
                                        )}
                                    </div>
                                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                                        {featureRequest.title}
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {featureRequest.project.name} ·{' '}
                                        {labels[featureRequest.priority]}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {featureRequest.status === 'open' && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.patch(
                                                start.url(featureRequest.id),
                                            )
                                        }
                                    >
                                        <Play className="size-4" />
                                        Mulai Dikerjakan
                                    </Button>
                                )}
                                {featureRequest.status !== 'fulfilled' && (
                                    <Button
                                        onClick={() => setFulfillOpen(true)}
                                    >
                                        <CheckCircle2 className="size-4" />
                                        Tandai Terpenuhi
                                    </Button>
                                )}
                                {featureRequest.status === 'fulfilled' && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.patch(
                                                reopen.url(featureRequest.id),
                                            )
                                        }
                                    >
                                        <RotateCcw className="size-4" />
                                        Buka Kembali
                                    </Button>
                                )}
                                <Button asChild variant="outline">
                                    <Link href={edit(featureRequest.id)}>
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                </Button>
                                {can.delete && (
                                    <Button
                                        variant="destructive"
                                        onClick={remove}
                                    >
                                        <Trash2 className="size-4" />
                                        Hapus
                                    </Button>
                                )}
                            </div>
                        </div>

                        {overdue && (
                            <div className="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-destructive">
                                <ClockAlert className="mt-0.5 size-5 shrink-0" />
                                <div>
                                    <p className="font-medium">
                                        Feature request melewati target SLA
                                    </p>
                                    <p className="mt-1 text-sm">
                                        Segera perbarui progres atau tandai
                                        terpenuhi agar capaian OKR tetap akurat.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b px-5 py-5">
                                    <CardTitle>Kebutuhan pengguna</CardTitle>
                                    <CardDescription>
                                        Konteks dan hasil yang diminta.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-5 py-5">
                                    <p className="max-w-3xl text-sm leading-7 whitespace-pre-wrap">
                                        {featureRequest.description}
                                    </p>

                                    {featureRequest.fulfillment_note && (
                                        <div className="mt-6 rounded-lg bg-[#E5F0E5] p-4 text-[#315f3a]">
                                            <p className="text-xs font-semibold">
                                                Catatan pemenuhan
                                            </p>
                                            <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
                                                {
                                                    featureRequest.fulfillment_note
                                                }
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b px-5 py-4">
                                    <CardTitle>Timeline SLA</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-5 px-5 py-5">
                                    <div className="flex gap-3">
                                        <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Diterima
                                            </p>
                                            <p className="mt-1 text-sm font-medium tabular-nums">
                                                {fullDate(
                                                    featureRequest.requested_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <ClockAlert className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Target
                                            </p>
                                            <p className="mt-1 text-sm font-medium tabular-nums">
                                                {new Date(
                                                    featureRequest.due_date,
                                                ).toLocaleDateString('id-ID', {
                                                    dateStyle: 'long',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {featureRequest.fulfilled_at && (
                                        <div className="flex gap-3">
                                            <CheckCircle2 className="mt-0.5 size-4 text-[#3F7A4A]" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Terpenuhi
                                                </p>
                                                <p className="mt-1 text-sm font-medium tabular-nums">
                                                    {fullDate(
                                                        featureRequest.fulfilled_at,
                                                    )}
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        featureRequest.is_on_time
                                                            ? 'mt-2 border-[#3F7A4A]/25 bg-[#E5F0E5] text-[#3F7A4A]'
                                                            : 'mt-2 border-destructive/25 bg-destructive/10 text-destructive'
                                                    }
                                                >
                                                    {featureRequest.is_on_time
                                                        ? 'Tepat waktu'
                                                        : 'Terlambat'}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>

            <Dialog open={fulfillOpen} onOpenChange={setFulfillOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tandai request terpenuhi</DialogTitle>
                        <DialogDescription>
                            Waktu pemenuhan dan status on-time akan dihitung
                            otomatis.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="fulfillment_note">
                            Catatan pemenuhan{' '}
                            <span className="text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <Textarea
                            id="fulfillment_note"
                            rows={5}
                            value={fulfillForm.data.fulfillment_note}
                            onChange={(event) =>
                                fulfillForm.setData(
                                    'fulfillment_note',
                                    event.target.value,
                                )
                            }
                            placeholder="Contoh: Fitur dirilis dan sudah diverifikasi pengguna."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFulfillOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={submitFulfillment}
                            disabled={fulfillForm.processing}
                        >
                            <CheckCircle2 className="size-4" />
                            Konfirmasi Terpenuhi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
