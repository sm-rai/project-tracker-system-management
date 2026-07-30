import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock3, Save, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';

import {
    store,
    update,
} from '@/actions/App/Http/Controllers/FeatureRequestController';
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
import { index } from '@/routes/feature-requests';
import type { DeployedProject } from '@/types/feature-request';

interface FormData {
    project_id: string;
    title: string;
    description: string;
    priority: string;
    requested_at: string;
}

interface Props {
    mode: 'create' | 'edit';
    featureRequestId?: number;
    initialData: FormData;
    deployedProjects: DeployedProject[];
    priorities: string[];
    slaConfigs: Record<string, number>;
}

const priorityLabels: Record<string, string> = {
    urgent: 'Mendesak',
    normal: 'Normal',
    low: 'Rendah',
};

const fieldLabels: Record<keyof FormData, string> = {
    project_id: 'Sistem terkait',
    title: 'Ringkasan permintaan',
    description: 'Kebutuhan dan konteks',
    priority: 'Prioritas',
    requested_at: 'Waktu permintaan diterima',
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

function targetDate(requestedAt: string, days: number) {
    if (!requestedAt) {
        return 'Menunggu waktu permintaan';
    }

    const date = new Date(requestedAt);
    date.setDate(date.getDate() + days);

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export function FeatureRequestForm({
    mode,
    featureRequestId,
    initialData,
    deployedProjects,
    priorities,
    slaConfigs,
}: Props) {
    const form = useForm<FormData>(initialData);
    const isSubmitting = useRef(false);
    const slaDays = slaConfigs[form.data.priority] ?? 3;
    const dueDate = useMemo(
        () => targetDate(form.data.requested_at, slaDays),
        [form.data.requested_at, slaDays],
    );

    useEffect(() => {
        const removeGuard = router.on('before', (event) => {
            if (
                form.isDirty &&
                !isSubmitting.current &&
                !window.confirm(
                    'Perubahan belum disimpan. Tetap tinggalkan halaman?',
                )
            ) {
                event.preventDefault();
            }
        });

        return removeGuard;
    }, [form.isDirty]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        isSubmitting.current = true;
        const options = {
            onFinish: () => {
                isSubmitting.current = false;
            },
        };

        if (mode === 'create') {
            form.post(store.url(), options);

            return;
        }

        form.put(update.url(featureRequestId!), options);
    };

    const errors = Object.entries(form.errors) as Array<
        [keyof FormData, string]
    >;

    return (
        <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
            <div className="flex items-start gap-3">
                <Button asChild variant="outline" size="icon">
                    <Link href={index()} aria-label="Kembali">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {mode === 'create'
                            ? 'Catat Feature Request'
                            : 'Edit Feature Request'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Rekam kebutuhan sistem beserta target pemenuhannya
                        berdasarkan SLA.
                    </p>
                </div>
            </div>

            <form
                onSubmit={submit}
                className="grid gap-5 xl:grid-cols-12 xl:items-start"
            >
                {errors.length > 0 && (
                    <Alert variant="destructive" className="xl:col-span-12">
                        <ShieldAlert />
                        <AlertTitle>Periksa kembali formulir</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc space-y-1 pl-4">
                                {errors.map(([field, message]) => (
                                    <li key={field}>
                                        <a
                                            href={`#${field}`}
                                            className="underline underline-offset-2"
                                        >
                                            {fieldLabels[field]}: {message}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="gap-0 py-0 xl:col-span-8">
                    <CardHeader className="border-b px-5 py-5">
                        <CardTitle>Informasi permintaan</CardTitle>
                        <CardDescription>
                            Pilih sistem operasional dan jelaskan hasil yang
                            dibutuhkan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 px-5 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="project_id">Sistem terkait</Label>
                            <Select
                                value={form.data.project_id}
                                onValueChange={(value) =>
                                    form.setData('project_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="project_id"
                                    aria-invalid={Boolean(
                                        form.errors.project_id,
                                    )}
                                    aria-describedby={
                                        form.errors.project_id
                                            ? 'project_id-error'
                                            : undefined
                                    }
                                >
                                    <SelectValue placeholder="Pilih sistem yang sudah deployed" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deployedProjects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={String(project.id)}
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Hanya sistem berjalan atau dalam pemeliharaan.
                            </p>
                            <FieldError
                                id="project_id-error"
                                message={form.errors.project_id}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Ringkasan permintaan</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder="Contoh: Tambahkan approval berjenjang"
                                aria-invalid={Boolean(form.errors.title)}
                                aria-describedby={
                                    form.errors.title
                                        ? 'title-error'
                                        : undefined
                                }
                            />
                            <FieldError
                                id="title-error"
                                message={form.errors.title}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Kebutuhan dan konteks
                            </Label>
                            <Textarea
                                id="description"
                                rows={7}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Jelaskan kebutuhan pengguna, tujuan, dan hasil yang diharapkan."
                                aria-invalid={Boolean(form.errors.description)}
                                aria-describedby={
                                    form.errors.description
                                        ? 'description-error'
                                        : undefined
                                }
                            />
                            <FieldError
                                id="description-error"
                                message={form.errors.description}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="requested_at">
                                Waktu permintaan diterima
                            </Label>
                            <Input
                                id="requested_at"
                                type="datetime-local"
                                value={form.data.requested_at}
                                onChange={(event) =>
                                    form.setData(
                                        'requested_at',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(form.errors.requested_at)}
                                aria-describedby={
                                    form.errors.requested_at
                                        ? 'requested_at-error'
                                        : undefined
                                }
                            />
                            <FieldError
                                id="requested_at-error"
                                message={form.errors.requested_at}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-0 xl:sticky xl:top-16 xl:col-span-4">
                    <CardHeader className="border-b px-5 py-4">
                        <CardTitle>Prioritas &amp; target</CardTitle>
                        <CardDescription>
                            Target dihitung dengan hari kalender.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 px-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Prioritas</Label>
                            <Select
                                value={form.data.priority}
                                onValueChange={(value) =>
                                    form.setData('priority', value)
                                }
                            >
                                <SelectTrigger
                                    id="priority"
                                    aria-invalid={Boolean(form.errors.priority)}
                                    aria-describedby={
                                        form.errors.priority
                                            ? 'priority-error'
                                            : undefined
                                    }
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorities.map((priority) => (
                                        <SelectItem
                                            key={priority}
                                            value={priority}
                                        >
                                            {priorityLabels[priority]} ·{' '}
                                            {slaConfigs[priority]} hari
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError
                                id="priority-error"
                                message={form.errors.priority}
                            />
                        </div>

                        <div className="rounded-lg bg-muted/60 p-4">
                            <div className="flex gap-3">
                                <Clock3 className="mt-0.5 size-4 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Target terpenuhi
                                    </p>
                                    <p className="mt-1 font-semibold tabular-nums">
                                        {dueDate}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        SLA {slaDays} hari kalender
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-3 border-t px-5 py-4">
                        <Button asChild variant="outline">
                            <Link href={index()}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Save className="size-4" />
                            {form.processing ? 'Menyimpan…' : 'Simpan'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
