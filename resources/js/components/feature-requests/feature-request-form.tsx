import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock3, Save, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';
import type { FormEvent } from 'react';

import {
    store,
    update,
} from '@/actions/App/Http/Controllers/FeatureRequestController';
import { SystemCombobox } from '@/components/projects/system-combobox';
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
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { formatAppLongDateTime, parseAppDateTimeInput } from '@/lib/datetime';
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
        <p id={id} className="text-xs font-medium text-danger">
            {message}
        </p>
    );
}

function targetDate(requestedAt: string, hours: number) {
    if (!requestedAt) {
        return 'Menunggu waktu permintaan';
    }

    const date = parseAppDateTimeInput(requestedAt);
    date.setTime(date.getTime() + hours * 60 * 60 * 1000);

    return formatAppLongDateTime(date);
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
    const { markSubmitting, markFinished, unsavedChangesDialog } =
        useUnsavedChanges(form.isDirty);
    const slaHours = slaConfigs[form.data.priority] ?? 72;
    const dueDate = useMemo(
        () => targetDate(form.data.requested_at, slaHours),
        [form.data.requested_at, slaHours],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        markSubmitting();
        const options = {
            onFinish: () => {
                markFinished();
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
        <>
            <div className="@container flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex items-start gap-3">
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0 md:size-9"
                    >
                        <Link href={index()} aria-label="Kembali">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {mode === 'create'
                                ? 'Tambah Feature Request'
                                : 'Edit Feature Request'}
                        </h1>
                        <p className="mt-0.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                            Jelaskan kebutuhan sistem dan target pemenuhannya
                            berdasarkan SLA.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="grid w-full gap-5 xl:grid-cols-12 xl:items-start"
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

                    <Card className="min-w-0 gap-0 border-border py-0 shadow-xs xl:col-span-8">
                        <CardHeader className="border-b border-border px-5 py-5 md:px-6">
                            <CardTitle className="text-base">
                                Informasi permintaan
                            </CardTitle>
                            <CardDescription>
                                Pilih sistem operasional dan jelaskan hasil yang
                                dibutuhkan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 px-5 py-5 md:px-6 md:py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="project_id">
                                    Sistem terkait
                                </Label>
                                <SystemCombobox
                                    id="project_id"
                                    projects={deployedProjects}
                                    value={form.data.project_id}
                                    onValueChange={(value) =>
                                        form.setData('project_id', value)
                                    }
                                    placeholder="Pilih sistem terkait"
                                    ariaInvalid={Boolean(
                                        form.errors.project_id,
                                    )}
                                    ariaDescribedBy={
                                        form.errors.project_id
                                            ? 'project_id-error project_id-help'
                                            : 'project_id-help'
                                    }
                                />
                                <p
                                    id="project_id-help"
                                    className="text-xs leading-relaxed text-muted-foreground"
                                >
                                    Hanya menampilkan sistem dengan status
                                    Berjalan atau Dalam pemeliharaan.
                                </p>
                                <FieldError
                                    id="project_id-error"
                                    message={form.errors.project_id}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="title">
                                    Ringkasan permintaan
                                </Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
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
                                    aria-invalid={Boolean(
                                        form.errors.description,
                                    )}
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
                                <DateTimePicker
                                    id="requested_at"
                                    value={form.data.requested_at}
                                    onChange={(value) =>
                                        form.setData('requested_at', value)
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.requested_at,
                                    )}
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

                    <Card className="min-w-0 gap-0 border-border py-0 shadow-xs xl:sticky xl:top-16 xl:col-span-4">
                        <CardHeader className="border-b border-border px-5 py-4">
                            <CardTitle className="text-base">
                                Priority &amp; Target
                            </CardTitle>
                            <CardDescription>
                                Target dihitung berdasarkan waktu berjalan,
                                termasuk malam dan akhir pekan.
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
                                        aria-invalid={Boolean(
                                            form.errors.priority,
                                        )}
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
                                                {slaConfigs[priority]} jam
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
                                            Target selesai
                                        </p>
                                        <p className="mt-1 font-semibold tabular-nums">
                                            {dueDate}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            SLA {slaHours} jam waktu berjalan
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4">
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
            {unsavedChangesDialog}
        </>
    );
}
