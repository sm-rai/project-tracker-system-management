import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    RotateCcw,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useFlashToast } from '@/hooks/use-flash-toast';

type Priority = 'urgent' | 'normal' | 'low';

interface SlaValues {
    configs: Record<Priority, string>;
}

interface SlaConfigProps {
    configs: Partial<Record<Priority, number>>;
}

interface PriorityDefinition {
    value: Priority;
    label: string;
    descriptor: string;
    description: string;
    iconClassName: string;
    badgeClassName: string;
}

const defaultConfigs: Record<Priority, string> = {
    urgent: '1',
    normal: '3',
    low: '7',
};

const priorityDefinitions: PriorityDefinition[] = [
    {
        value: 'urgent',
        label: 'Mendesak',
        descriptor: 'Prioritas tertinggi',
        description:
            'Gangguan kritis yang menghentikan atau sangat menghambat operasional.',
        iconClassName: 'border-danger/20 bg-danger-surface text-danger',
        badgeClassName: 'border-danger/20 bg-danger-surface text-danger',
    },
    {
        value: 'normal',
        label: 'Normal',
        descriptor: 'Operasional terganggu',
        description:
            'Gangguan yang memengaruhi pekerjaan, tetapi operasional masih dapat berjalan.',
        iconClassName: 'border-warning/20 bg-warning-surface text-warning',
        badgeClassName: 'border-warning/20 bg-warning-surface text-warning',
    },
    {
        value: 'low',
        label: 'Rendah',
        descriptor: 'Dampak terbatas',
        description:
            'Gangguan minor atau permintaan yang tidak menghambat operasional utama.',
        iconClassName: 'border-info/20 bg-info-surface text-info',
        badgeClassName: 'border-info/20 bg-info-surface text-info',
    },
];

function getPreviewDate(daysValue: string): string {
    const days = Number(daysValue);

    if (!Number.isInteger(days) || days < 1 || days > 365) {
        return 'Nilai belum valid';
    }

    const targetDate = new Date();
    targetDate.setHours(12, 0, 0, 0);
    targetDate.setDate(targetDate.getDate() + days);

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(targetDate);
}

export default function SlaConfigPage({ configs }: SlaConfigProps) {
    useFlashToast();

    const initialConfigs: Record<Priority, string> = {
        urgent: String(configs.urgent ?? 1),
        normal: String(configs.normal ?? 3),
        low: String(configs.low ?? 7),
    };
    const {
        data,
        setData,
        put,
        processing,
        errors,
        clearErrors,
        isDirty,
        recentlySuccessful,
        resetAndClearErrors,
        setDefaults,
    } = useForm<SlaValues>({
        configs: initialConfigs,
    });
    const isSubmittingRef = useRef(false);

    const priorityErrors = useMemo(
        () =>
            priorityDefinitions
                .map((priority) => ({
                    ...priority,
                    error: errors[`configs.${priority.value}`],
                }))
                .filter((priority) => Boolean(priority.error)),
        [errors],
    );

    useEffect(() => {
        if (priorityErrors.length === 0) {
            return;
        }

        window.requestAnimationFrame(() => {
            document.getElementById('sla-form-errors')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            document
                .getElementById(`configs-${priorityErrors[0].value}`)
                ?.focus();
        });
    }, [priorityErrors]);

    useEffect(() => {
        const removeInertiaGuard = router.on('before', (event) => {
            if (!isDirty || isSubmittingRef.current) {
                return;
            }

            if (
                !window.confirm(
                    'Perubahan SLA belum diterapkan. Tetap tinggalkan halaman?',
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

    const handleValueChange = (priority: Priority, value: string) => {
        setData('configs', {
            ...data.configs,
            [priority]: value,
        });
        clearErrors(`configs.${priority}`);
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        isSubmittingRef.current = true;

        put('/settings/sla', {
            preserveScroll: true,
            onSuccess: () => {
                setDefaults();
            },
            onFinish: () => {
                isSubmittingRef.current = false;
            },
        });
    };

    const restoreRecommendedDefaults = () => {
        setData('configs', defaultConfigs);
        clearErrors();
    };

    const resetToSavedValues = () => {
        resetAndClearErrors();
    };

    return (
        <>
            <Head title="Pengaturan SLA" />
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
                    <SiteHeader title="Pengaturan SLA" />
                    <main className="@container flex flex-1 flex-col gap-5 p-4 md:p-6">
                        <header className="max-w-3xl">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                Atur target penyelesaian
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Tetapkan jumlah hari kalender untuk penyelesaian
                                issue dan feature request berdasarkan tingkat
                                prioritas.
                            </p>
                        </header>

                        <form
                            onSubmit={handleSubmit}
                            className="grid w-full max-w-7xl gap-5 xl:grid-cols-12 xl:items-start"
                            noValidate
                        >
                            {priorityErrors.length > 0 && (
                                <Alert
                                    id="sla-form-errors"
                                    variant="destructive"
                                    aria-live="assertive"
                                    className="xl:col-span-12"
                                >
                                    <AlertTriangle />
                                    <AlertTitle>
                                        Periksa kembali target SLA
                                    </AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc space-y-1 pl-4">
                                            {priorityErrors.map((priority) => (
                                                <li key={priority.value}>
                                                    <a
                                                        href={`#configs-${priority.value}`}
                                                        className="font-medium underline underline-offset-2"
                                                    >
                                                        {priority.error}
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
                                        Target per prioritas
                                    </CardTitle>
                                    <CardDescription className="max-w-2xl">
                                        Masukkan target antara 1 sampai 365 hari
                                        kalender. Nilai ini menjadi acuan
                                        perhitungan tenggat otomatis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="divide-y divide-border p-0">
                                    {priorityDefinitions.map((priority) => {
                                        const error =
                                            errors[`configs.${priority.value}`];

                                        return (
                                            <section
                                                key={priority.value}
                                                className="grid min-w-0 gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:px-6"
                                            >
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <span
                                                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${priority.iconClassName}`}
                                                        aria-hidden="true"
                                                    >
                                                        <ShieldCheck className="size-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-semibold text-foreground">
                                                                {priority.label}
                                                            </h3>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    priority.badgeClassName
                                                                }
                                                            >
                                                                {
                                                                    priority.descriptor
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                                                            {
                                                                priority.description
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid gap-1.5 sm:justify-items-end">
                                                    <Label
                                                        htmlFor={`configs-${priority.value}`}
                                                        className="sr-only"
                                                    >
                                                        Target SLA{' '}
                                                        {priority.label} dalam
                                                        hari kalender
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id={`configs-${priority.value}`}
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={1}
                                                            max={365}
                                                            value={
                                                                data.configs[
                                                                    priority
                                                                        .value
                                                                ]
                                                            }
                                                            onChange={(event) =>
                                                                handleValueChange(
                                                                    priority.value,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-11 w-24 bg-background text-right text-data md:h-10"
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            aria-describedby={
                                                                error
                                                                    ? `configs-${priority.value}-error`
                                                                    : undefined
                                                            }
                                                            required
                                                        />
                                                        <span className="w-24 text-sm text-muted-foreground">
                                                            hari kalender
                                                        </span>
                                                    </div>
                                                    {error && (
                                                        <p
                                                            id={`configs-${priority.value}-error`}
                                                            className="max-w-xs text-xs font-medium text-destructive sm:text-right"
                                                        >
                                                            {error}
                                                        </p>
                                                    )}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            <Card className="min-w-0 gap-0 border-border py-0 shadow-xs xl:sticky xl:top-16 xl:col-span-4">
                                <CardHeader className="border-b border-border px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="size-4 text-primary" />
                                        <CardTitle className="text-base">
                                            Dampak kebijakan
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Preview target jika laporan dibuat hari
                                        ini.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 px-5 py-4">
                                    <div className="grid gap-2.5">
                                        {priorityDefinitions.map((priority) => (
                                            <div
                                                key={priority.value}
                                                className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-3 py-2.5"
                                            >
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {priority.label}
                                                </span>
                                                <span className="text-right text-sm font-semibold text-foreground tabular-nums">
                                                    {getPreviewDate(
                                                        data.configs[
                                                            priority.value
                                                        ],
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-lg bg-info-surface p-3 text-info">
                                        <p className="text-xs font-semibold">
                                            Berlaku untuk item baru
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-info/90">
                                            Perubahan digunakan saat menghitung
                                            tenggat issue dan feature request
                                            baru. Tenggat item yang sudah
                                            tercatat tidak berubah.
                                        </p>
                                    </div>

                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Ketepatan penyelesaian terhadap target
                                        ini menjadi dasar pengukuran OKR 2.
                                    </p>
                                </CardContent>
                                <CardFooter className="grid gap-3 border-t border-border px-5 py-4">
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="min-h-5"
                                    >
                                        {recentlySuccessful ? (
                                            <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                                                <CheckCircle2 className="size-3.5" />
                                                Perubahan SLA tersimpan.
                                            </p>
                                        ) : isDirty ? (
                                            <p className="text-xs font-medium text-warning">
                                                Ada perubahan yang belum
                                                diterapkan.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Konfigurasi sudah sesuai data
                                                tersimpan.
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 px-3 md:h-10"
                                            disabled={!isDirty || processing}
                                            onClick={resetToSavedValues}
                                        >
                                            Batalkan
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="h-11 gap-2 px-3 md:h-10"
                                            disabled={!isDirty || processing}
                                        >
                                            <Save className="size-4" />
                                            {processing
                                                ? 'Menerapkan...'
                                                : 'Terapkan SLA'}
                                        </Button>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-11 gap-2 text-muted-foreground md:h-10"
                                        disabled={processing}
                                        onClick={restoreRecommendedDefaults}
                                    >
                                        <RotateCcw className="size-4" />
                                        Kembalikan default 1 / 3 / 7
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
