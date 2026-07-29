import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { ArrowLeft, Clock, Save } from 'lucide-react';

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

interface Issue {
    id: number;
    project_id: number | null;
    title: string;
    description: string;
    priority: string;
    root_cause_category: string;
    reported_at: string;
    due_date: string;
}

interface IssueEditProps {
    issue: Issue;
    deployedProjects: Project[];
    priorities: string[];
    rootCauses: string[];
    slaConfigs: Record<string, number>;
}

export default function IssueEditPage({
    issue,
    deployedProjects,
    priorities,
    rootCauses,
    slaConfigs,
}: IssueEditProps) {
    const formatToLocalISO = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const { data, setData, put, processing, errors } = useForm({
        project_id: issue.project_id ? issue.project_id.toString() : '',
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        root_cause_category: issue.root_cause_category,
        reported_at: formatToLocalISO(issue.reported_at),
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/issues/${issue.id}`);
    };

    const currentSlaDays = slaConfigs[data.priority] || 3;

    return (
        <>
            <Head title={`Edit Issue #${issue.id}`} />
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
                    <SiteHeader title={`Edit Issue #${issue.id}`} />
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        <div className="flex items-center gap-4">
                            <Button asChild variant="outline" size="icon">
                                <Link href="/issues">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Edit Detail Issue #{issue.id}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Perbarui data atau informasi kendala sistem.
                                </p>
                            </div>
                        </div>

                        <Card className="max-w-3xl">
                            <CardHeader>
                                <CardTitle>Formulir Edit Issue</CardTitle>
                                <CardDescription>
                                    Perubahan prioritas atau waktu lapor akan mengalkulasi ulang tenggat waktu (*due date*).
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
                                        {errors.project_id && (
                                            <p className="text-xs text-red-500">{errors.project_id}</p>
                                        )}
                                    </div>

                                    {/* Judul Issue */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Judul Kendala / Ringkasan Masalah *</Label>
                                        <Input
                                            id="title"
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
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            required
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-500">{errors.description}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Prioritas */}
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Skala Prioritas *</Label>
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
                                                            {p.toUpperCase()} ({slaConfigs[p] || 3} hari)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Target Waktu: {currentSlaDays} hari kalender</span>
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
                                            {processing ? 'Menyimpan...' : 'Perbarui Issue'}
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
