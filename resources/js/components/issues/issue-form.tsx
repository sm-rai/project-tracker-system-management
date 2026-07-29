import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, Save, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Project {
    id: number;
    name: string;
    status: string;
}

export interface IssueFormData {
    project_id: string;
    title: string;
    description: string;
    priority: string;
    root_cause_category: string;
    reported_at: string;
}

interface IssueFormProps {
    mode: 'create' | 'edit';
    action: string;
    initialData: IssueFormData;
    deployedProjects: Project[];
    priorities: string[];
    rootCauses: string[];
    slaConfigs: Record<string, number>;
    issueId?: number;
}

const fieldLabels: Record<keyof IssueFormData, string> = {
    project_id: 'Sistem terdampak',
    title: 'Ringkasan issue',
    description: 'Kronologi dan dampak',
    priority: 'Prioritas penanganan',
    root_cause_category: 'Dugaan penyebab',
    reported_at: 'Waktu dilaporkan',
};

const priorityLabels: Record<string, string> = {
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

const rootCauseLabels: Record<string, string> = {
    system_error: 'Kesalahan sistem atau perangkat lunak',
    non_system: 'Proses operasional atau penggunaan',
    other: 'Infrastruktur atau penyebab lain',
};

const projectStatusLabels: Record<string, string> = {
    deployed_running: 'Berjalan',
    deployed_maintenance: 'Dalam pemeliharaan',
};

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} className="text-xs font-medium text-destructive">
            {message}
        </p>
    );
}

function getTargetDate(reportedAt: string, slaDays: number): string {
    if (!reportedAt) {
        return 'Menunggu waktu laporan';
    }

    const targetDate = new Date(reportedAt);

    if (Number.isNaN(targetDate.getTime())) {
        return 'Waktu laporan belum valid';
    }

    targetDate.setDate(targetDate.getDate() + slaDays);

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(targetDate);
}

export function IssueForm({
    mode,
    action,
    initialData,
    deployedProjects,
    priorities,
    rootCauses,
    slaConfigs,
    issueId,
}: IssueFormProps) {
    const { data, setData, post, put, processing, errors, isDirty } =
        useForm<IssueFormData>(initialData);
    const isSubmittingRef = useRef(false);

    const currentSlaDays = slaConfigs[data.priority] || 3;
    const targetDate = useMemo(
        () => getTargetDate(data.reported_at, currentSlaDays),
        [currentSlaDays, data.reported_at],
    );
    const errorEntries = useMemo(
        () => Object.entries(errors) as [keyof IssueFormData, string][],
        [errors],
    );

    useEffect(() => {
        if (errorEntries.length === 0) {
            return;
        }

        window.requestAnimationFrame(() => {
            document.getElementById('issue-form-errors')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            document.getElementById(errorEntries[0][0])?.focus();
        });
    }, [errorEntries]);

    useEffect(() => {
        const removeInertiaGuard = router.on('before', (event) => {
            if (!isDirty || isSubmittingRef.current) {
                return;
            }

            if (
                !window.confirm(
                    'Perubahan pada formulir belum disimpan. Tetap tinggalkan halaman?',
                )
            ) {
                event.preventDefault();
            }
        });

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isDirty || isSubmittingRef.current) {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            removeInertiaGuard();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        isSubmittingRef.current = true;

        const options = {
            onFinish: () => {
                isSubmittingRef.current = false;
            },
        };

        if (mode === 'create') {
            post(action, options);

            return;
        }

        put(action, options);
    };

    const pageTitle =
        mode === 'create' ? 'Catat Issue' : `Edit Issue #${issueId}`;
    const pageDescription =
        mode === 'create'
            ? 'Catat gangguan operasional agar penanganan dan target penyelesaiannya dapat dipantau.'
            : 'Perbarui informasi issue agar status penanganan dan target penyelesaiannya tetap akurat.';
    const submitLabel = mode === 'create' ? 'Simpan Issue' : 'Perbarui Issue';

    return (
        <div className="@container flex flex-1 flex-col gap-5 p-4 md:p-6">
            <div className="flex items-start gap-3">
                <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 md:size-9"
                >
                    <Link href="/issues" aria-label="Kembali ke daftar issue">
                        <ArrowLeft className="size-4" />
                        <span className="sr-only">Kembali ke daftar issue</span>
                    </Link>
                </Button>
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {pageTitle}
                    </h2>
                    <p className="mt-0.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {pageDescription}
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid w-full gap-5 xl:grid-cols-12 xl:items-start"
                noValidate
            >
                {errorEntries.length > 0 && (
                    <Alert
                        id="issue-form-errors"
                        variant="destructive"
                        aria-live="assertive"
                        className="xl:col-span-12"
                    >
                        <ShieldAlert />
                        <AlertTitle>
                            Periksa kembali informasi berikut
                        </AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc space-y-1 pl-4">
                                {errorEntries.map(([field, message]) => (
                                    <li key={field}>
                                        <a
                                            href={`#${field}`}
                                            className="font-medium underline underline-offset-2"
                                        >
                                            {fieldLabels[field]}: {message}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="min-w-0 gap-0 border-border py-0 shadow-xs xl:col-span-8">
                    <CardHeader className="border-b border-border px-5 py-5 md:px-6">
                        <CardTitle className="text-base">
                            Informasi issue
                        </CardTitle>
                        <CardDescription>
                            Jelaskan sistem yang terdampak, apa yang terjadi,
                            dan kapan issue dilaporkan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 px-5 py-5 md:px-6 md:py-6">
                        <div className="grid min-w-0 gap-2">
                            <Label htmlFor="project_id">Sistem terdampak</Label>
                            <Select
                                value={data.project_id || 'none'}
                                onValueChange={(value) =>
                                    setData(
                                        'project_id',
                                        value === 'none' ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="project_id"
                                    className="w-full min-w-0 data-[size=default]:h-11 md:data-[size=default]:h-9"
                                    aria-invalid={Boolean(errors.project_id)}
                                    aria-describedby={
                                        errors.project_id
                                            ? 'project_id-error project_id-help'
                                            : 'project_id-help'
                                    }
                                >
                                    <SelectValue placeholder="Pilih sistem terdampak" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Tidak terkait sistem tertentu
                                    </SelectItem>
                                    {deployedProjects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id.toString()}
                                        >
                                            {project.name} ·{' '}
                                            {projectStatusLabels[
                                                project.status
                                            ] || project.status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p
                                id="project_id-help"
                                className="text-xs leading-relaxed text-muted-foreground"
                            >
                                Daftar hanya memuat sistem yang sudah berjalan
                                atau sedang dalam pemeliharaan.
                            </p>
                            <FieldError
                                id="project_id-error"
                                message={errors.project_id}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">
                                Ringkasan issue{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Contoh: Gagal menyimpan transaksi pada POS"
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                className="h-11 md:h-9"
                                aria-invalid={Boolean(errors.title)}
                                aria-describedby={
                                    errors.title ? 'title-error' : undefined
                                }
                                required
                            />
                            <FieldError
                                id="title-error"
                                message={errors.title}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Kronologi dan dampak{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                rows={5}
                                placeholder="Jelaskan apa yang terjadi, pesan error yang muncul, langkah terakhir sebelum issue terjadi, dan dampaknya terhadap operasional."
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                className="min-h-32 resize-y"
                                aria-invalid={Boolean(errors.description)}
                                aria-describedby={
                                    errors.description
                                        ? 'description-error'
                                        : undefined
                                }
                                required
                            />
                            <FieldError
                                id="description-error"
                                message={errors.description}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reported_at">
                                Waktu dilaporkan{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="reported_at"
                                type="datetime-local"
                                value={data.reported_at}
                                onChange={(event) =>
                                    setData('reported_at', event.target.value)
                                }
                                className="h-11 md:h-9"
                                aria-invalid={Boolean(errors.reported_at)}
                                aria-describedby={
                                    errors.reported_at
                                        ? 'reported_at-error reported_at-help'
                                        : 'reported_at-help'
                                }
                                required
                            />
                            <p
                                id="reported_at-help"
                                className="text-xs leading-relaxed text-muted-foreground"
                            >
                                Waktu saat ini terisi otomatis. Ubah jika issue
                                dilaporkan setelah kejadian.
                            </p>
                            <FieldError
                                id="reported_at-error"
                                message={errors.reported_at}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="min-w-0 space-y-5 xl:sticky xl:top-16 xl:col-span-4">
                    <Card className="gap-0 border-border py-0 shadow-xs">
                        <CardHeader className="border-b border-border px-5 py-4">
                            <CardTitle className="text-base">
                                Klasifikasi &amp; target
                            </CardTitle>
                            <CardDescription>
                                Tentukan urgensi dan dugaan awal untuk membantu
                                proses tindak lanjut.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 px-5 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="priority">
                                    Prioritas penanganan{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.priority}
                                    onValueChange={(value) =>
                                        setData('priority', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="priority"
                                        className="w-full min-w-0 data-[size=default]:h-11 md:data-[size=default]:h-9"
                                        aria-invalid={Boolean(errors.priority)}
                                        aria-describedby={
                                            errors.priority
                                                ? 'priority-error'
                                                : undefined
                                        }
                                    >
                                        <SelectValue placeholder="Pilih prioritas penanganan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((priority) => (
                                            <SelectItem
                                                key={priority}
                                                value={priority}
                                            >
                                                {priorityLabels[priority] ||
                                                    priority}{' '}
                                                · {slaConfigs[priority] || 3}{' '}
                                                hari
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError
                                    id="priority-error"
                                    message={errors.priority}
                                />
                            </div>

                            <div
                                className="rounded-lg bg-muted/60 p-3"
                                aria-live="polite"
                            >
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Target selesai
                                        </p>
                                        <p className="mt-0.5 font-semibold text-foreground tabular-nums">
                                            {targetDate}
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            Dihitung otomatis dari waktu laporan
                                            dan SLA{' '}
                                            <span className="font-medium tabular-nums">
                                                {currentSlaDays} hari kalender
                                            </span>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="root_cause_category">
                                    Dugaan penyebab{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.root_cause_category}
                                    onValueChange={(value) =>
                                        setData('root_cause_category', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="root_cause_category"
                                        className="w-full min-w-0 data-[size=default]:h-11 md:data-[size=default]:h-9"
                                        aria-invalid={Boolean(
                                            errors.root_cause_category,
                                        )}
                                        aria-describedby={
                                            errors.root_cause_category
                                                ? 'root_cause_category-error root_cause_category-help'
                                                : 'root_cause_category-help'
                                        }
                                    >
                                        <SelectValue placeholder="Pilih dugaan penyebab" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rootCauses.map((rootCause) => (
                                            <SelectItem
                                                key={rootCause}
                                                value={rootCause}
                                            >
                                                {rootCauseLabels[rootCause] ||
                                                    rootCause}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p
                                    id="root_cause_category-help"
                                    className="text-xs leading-relaxed text-muted-foreground"
                                >
                                    Dapat diperbarui setelah investigasi.
                                </p>
                                <FieldError
                                    id="root_cause_category-error"
                                    message={errors.root_cause_category}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 border-border py-0 shadow-xs">
                        <CardContent className="px-5 py-4">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Pastikan ringkasan, waktu laporan, dan prioritas
                                sudah sesuai sebelum menyimpan.
                            </p>
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-3 border-t border-border px-5 py-3">
                            <Button
                                asChild
                                variant="outline"
                                className="h-11 md:h-10"
                            >
                                <Link href="/issues">Batal</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="h-11 gap-2 md:h-10"
                            >
                                <Save className="size-4" />
                                {processing ? 'Menyimpan…' : submitLabel}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <p role="status" aria-live="polite" className="sr-only">
                    {processing ? 'Issue sedang disimpan.' : ''}
                </p>
            </form>
        </div>
    );
}
