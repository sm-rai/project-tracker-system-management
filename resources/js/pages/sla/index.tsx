import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Clock, Save, ShieldAlert } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface SlaConfigProps {
    configs: {
        urgent?: number;
        normal?: number;
        low?: number;
    };
}

export default function SlaConfigPage({ configs }: SlaConfigProps) {
    const { data, setData, put, processing, errors } = useForm({
        configs: {
            urgent: configs?.urgent ?? 1,
            normal: configs?.normal ?? 3,
            low: configs?.low ?? 7,
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put('/settings/sla');
    };

    return (
        <>
            <Head title="Konfigurasi SLA" />
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
                    <SiteHeader title="Konfigurasi SLA" />
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Service Level Agreement (SLA)
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Pengaturan target waktu penyelesaian kendala (*target resolution days*) berdasarkan skala prioritas.
                            </p>
                        </div>

                        <Card className="max-w-2xl">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <CardTitle>Target Penyelesaian per Prioritas</CardTitle>
                                </div>
                                <CardDescription>
                                    Tenggat waktu (*due date*) isu baru akan dihitung secara otomatis berdasarkan nilai di bawah ini.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Urgent */}
                                        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-950 dark:bg-red-950/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    <Label htmlFor="urgent" className="font-semibold text-red-900 dark:text-red-200">
                                                        Urgent (Darurat)
                                                    </Label>
                                                </div>
                                                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                                    Sangat Kritis
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="urgent"
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    value={data.configs.urgent}
                                                    onChange={(e) =>
                                                        setData('configs', {
                                                            ...data.configs,
                                                            urgent: parseInt(e.target.value) || 1,
                                                        })
                                                    }
                                                    className="w-32 bg-background"
                                                />
                                                <span className="text-sm text-muted-foreground">Hari Kalender</span>
                                            </div>
                                            {errors['configs.urgent'] && (
                                                <p className="text-xs text-red-600">{errors['configs.urgent']}</p>
                                            )}
                                        </div>

                                        {/* Normal */}
                                        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="normal" className="font-semibold text-amber-900 dark:text-amber-200">
                                                    Normal (Standar)
                                                </Label>
                                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    Pengoperasian Normal
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="normal"
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    value={data.configs.normal}
                                                    onChange={(e) =>
                                                        setData('configs', {
                                                            ...data.configs,
                                                            normal: parseInt(e.target.value) || 1,
                                                        })
                                                    }
                                                    className="w-32 bg-background"
                                                />
                                                <span className="text-sm text-muted-foreground">Hari Kalender</span>
                                            </div>
                                            {errors['configs.normal'] && (
                                                <p className="text-xs text-red-600">{errors['configs.normal']}</p>
                                            )}
                                        </div>

                                        {/* Low */}
                                        <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-950 dark:bg-blue-950/20">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="low" className="font-semibold text-blue-900 dark:text-blue-200">
                                                    Low (Rendah)
                                                </Label>
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                    Minor / Non-Kritis
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="low"
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    value={data.configs.low}
                                                    onChange={(e) =>
                                                        setData('configs', {
                                                            ...data.configs,
                                                            low: parseInt(e.target.value) || 1,
                                                        })
                                                    }
                                                    className="w-32 bg-background"
                                                />
                                                <span className="text-sm text-muted-foreground">Hari Kalender</span>
                                            </div>
                                            {errors['configs.low'] && (
                                                <p className="text-xs text-red-600">{errors['configs.low']}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {processing ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
