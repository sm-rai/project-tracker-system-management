import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { ArrowLeft, Clock, Save, ShieldAlert } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';

interface Project {
    id: number;
    name: string;
    status: string;
}

interface IssueCreateProps {
    deployedProjects: Project[];
    priorities: string[];
    rootCauses: string[];
    slaConfigs: Record<string, number>;
}

export default function IssueCreatePage({
    deployedProjects,
    priorities,
    rootCauses,
    slaConfigs,
}: IssueCreateProps) {
    const getCurrentLocalISO = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const { data, setData, post, processing, errors } = useForm({
        project_id: '',
        title: '',
        description: '',
        priority: 'normal',
        root_cause_category: 'system_error',
        reported_at: getCurrentLocalISO(),
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/issues');
    };

    const currentSlaDays = slaConfigs[data.priority] || 3;

    return (
        <>
            <Head title="Tambah Issue Baru" />
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
                    <SiteHeader title="Tambah Issue Baru" />
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        <div className="flex items-center gap-4">
                            <Button asChild variant="outline" size="icon">
                                <Link href="/issues">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Catat Kendala System Baru
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Isi informasi kendala teknis atau gangguan sistem di bawah ini.
                                </p>
                            </div>
                        </div>

                        <Card className="max-w-3xl">
                            <CardHeader>
                                <CardTitle>Formulir Kendala (Issue)</CardTitle>
                                <CardDescription>
                                    Tenggat waktu (*due date*) akan dihitung secara otomatis berdasarkan SLA prioritas.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* System / Project Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="project_id">Sistem / Project Terkait</Label>
                                        <Select
                                            value={data.project_id || 'none'}
                                            onValueChange={(val) =>
                                                setData('project_id', val === 'none' ? '' : val)
                                            }
                                        >
                                            <SelectTrigger id="project_id">
                                                <SelectValue placeholder="Pilih System / Project..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    -- Tidak Terikat System (Umum / Infrastruktur) --
                                                </SelectItem>
                                                {deployedProjects.map((proj) => (
                                                    <SelectItem key={proj.id} value={proj.id.toString()}>
                                                        {proj.name} ({proj.status})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            *Hanya menampilkan project yang sudah di-deploy (Running / Maintenance).
                                        </p>
                                        {errors.project_id && (
                                            <p className="text-xs text-red-500">{errors.project_id}</p>
                                        )}
                                    </div>

                                    {/* Judul Issue */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Judul Kendala / Ringkasan Masalah *</Label>
                                        <Input
                                            id="title"
                                            placeholder="Contoh: Error 500 saat simpan data transaksi"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            required
                                        />
                                        {errors.title && (
                                            <p className="text-xs text-red-500">{errors.title}</p>
                                        )}
                                    </div>

                                    {/* Deskripsi Issue */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Deskripsi Detail Masalah *</Label>
                                        <Textarea
                                            id="description"
                                            rows={4}
                                            placeholder="Jelaskan detail kronologi, pesan error, atau dampaknya..."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            required
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-500">{errors.description}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Prioritas SLA */}
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Skala Prioritas SLA *</Label>
                                            <Select
                                                value={data.priority}
                                                onValueChange={(val) => setData('priority', val)}
                                            >
                                                <SelectTrigger id="priority">
                                                    <SelectValue placeholder="Pilih Prioritas..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {priorities.map((p) => (
                                                        <SelectItem key={p} value={p}>
                                                            {p.toUpperCase()} (Target: {slaConfigs[p] || 3} hari)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Target SLA: {currentSlaDays} hari kalender</span>
                                            </div>
                                            {errors.priority && (
                                                <p className="text-xs text-red-500">{errors.priority}</p>
                                            )}
                                        </div>

                                        {/* Kategori Root Cause */}
                                        <div className="space-y-2">
                                            <Label htmlFor="root_cause_category">Kategori Penyebab (Root Cause) *</Label>
                                            <Select
                                                value={data.root_cause_category}
                                                onValueChange={(val) => setData('root_cause_category', val)}
                                            >
                                                <SelectTrigger id="root_cause_category">
                                                    <SelectValue placeholder="Pilih Kategori..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="system_error">System Error / Bug Software</SelectItem>
                                                    <SelectItem value="non_system">Non-System / User Error / Process</SelectItem>
                                                    <SelectItem value="other">Lainnya / Infrastruktur</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.root_cause_category && (
                                                <p className="text-xs text-red-500">{errors.root_cause_category}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Waktu Pelaporan */}
                                    <div className="space-y-2">
                                        <Label htmlFor="reported_at">Waktu Pelaporan (Reported At) *</Label>
                                        <Input
                                            id="reported_at"
                                            type="datetime-local"
                                            value={data.reported_at}
                                            onChange={(e) => setData('reported_at', e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Default diisi waktu sekarang, dapat diubah jika pelaporan susulan (backdate).
                                        </p>
                                        {errors.reported_at && (
                                            <p className="text-xs text-red-500">{errors.reported_at}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <Button asChild variant="outline">
                                            <Link href="/issues">Batal</Link>
                                        </Button>
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            {processing ? 'Menyimpan...' : 'Simpan Issue'}
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
