import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconArrowLeft,
    IconCheck,
    IconPlus,
    IconTrash,
    IconUsers,
} from '@tabler/icons-react';
import React from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
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
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { User } from '@/types/auth';

interface CreateProjectProps {
    statuses: Array<{ value: string; label: string }>;
    available_users: User[];
}

interface BriefFeatureInput {
    name: string;
    description: string;
}

export default function CreateProject({
    statuses,
    available_users = [],
}: CreateProjectProps) {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        name: '',
        description: '',
        status: 'planning',
        start_date: '',
        target_end_date: '',
        user_ids: [] as number[],
        brief_features: [] as BriefFeatureInput[],
    });
    const { markSubmitting, markFinished, unsavedChangesDialog } =
        useUnsavedChanges(isDirty);
    const isExistingSystem =
        data.status === 'deployed_running' ||
        data.status === 'deployed_maintenance';

    const handleExistingSystemToggle = (checked: boolean | 'indeterminate') => {
        setData('status', checked === true ? 'deployed_running' : 'planning');
    };

    const handleUserToggle = (userId: number) => {
        if (data.user_ids.includes(userId)) {
            setData(
                'user_ids',
                data.user_ids.filter((id) => id !== userId),
            );
        } else {
            setData('user_ids', [...data.user_ids, userId]);
        }
    };

    const handleAddBriefFeature = () => {
        setData('brief_features', [
            ...data.brief_features,
            { name: '', description: '' },
        ]);
    };

    const handleRemoveBriefFeature = (index: number) => {
        const updated = [...data.brief_features];
        updated.splice(index, 1);
        setData('brief_features', updated);
    };

    const handleBriefFeatureChange = (
        index: number,
        field: keyof BriefFeatureInput,
        value: string,
    ) => {
        const updated = [...data.brief_features];
        updated[index] = { ...updated[index], [field]: value };
        setData('brief_features', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        markSubmitting();
        post('/projects', { onFinish: markFinished });
    };

    return (
        <>
            <Head title="Tambah Project Baru — System Management" />
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
                    <SiteHeader title="Tambah Project Baru" />

                    <div className="flex w-full flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
                        {/* Back Link & Header */}
                        <div className="flex items-center gap-3 pt-4 md:pt-2">
                            <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="size-11 border-border hover:bg-background-soft md:size-8"
                            >
                                <Link href="/projects">
                                    <span className="sr-only">
                                        Kembali ke daftar project
                                    </span>
                                    <IconArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Tambah Project / Sistem Baru
                                </h1>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Catat project pengembangan atau sistem yang
                                    sudah berjalan, lalu tentukan tim yang
                                    mengelolanya.
                                </p>
                            </div>
                        </div>

                        {/* Form Body - Full Width */}
                        {Object.keys(errors).length > 0 && (
                            <div
                                role="alert"
                                className="rounded-lg border border-danger/25 bg-danger-surface p-4 text-sm text-danger"
                            >
                                Beberapa data belum valid. Periksa field yang
                                ditandai sebelum menyimpan project.
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="flex w-full flex-col gap-6"
                        >
                            <Card className="w-full gap-0 border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border pb-4">
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        Project Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5 pt-6">
                                    {/* Row 1: Name & Status */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label
                                                htmlFor="name"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                Nama Project / Sistem{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Contoh: POS ATSIRI / WMS Warehouse"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 border-border text-sm focus-visible:ring-ring/30"
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-danger">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="status"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                Status Lifecycle{' '}
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(val) =>
                                                    setData('status', val)
                                                }
                                            >
                                                <SelectTrigger className="h-9 border-border text-xs">
                                                    <SelectValue placeholder="Pilih status lifecycle" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((s) => (
                                                        <SelectItem
                                                            key={s.value}
                                                            value={s.value}
                                                            className="text-xs"
                                                        >
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-xs text-danger">
                                                    {errors.status}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border border-border bg-background-soft/50 p-3">
                                        <Checkbox
                                            id="existing_system"
                                            checked={isExistingSystem}
                                            aria-describedby="existing_system_hint"
                                            onCheckedChange={
                                                handleExistingSystemToggle
                                            }
                                            className="mt-0.5 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                        />
                                        <div className="grid gap-1">
                                            <Label
                                                htmlFor="existing_system"
                                                className="cursor-pointer text-xs font-semibold text-foreground"
                                            >
                                                Sistem sudah berjalan
                                            </Label>
                                            <p
                                                id="existing_system_hint"
                                                className="text-xs leading-relaxed text-muted-foreground"
                                            >
                                                Pilih untuk sistem lama yang
                                                langsung dicatat sebagai
                                                Running. Status dapat diubah ke
                                                Maintenance bila diperlukan.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 2: Description */}
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="description"
                                            className="text-xs font-semibold text-foreground"
                                        >
                                            Deskripsi Ringkas
                                        </Label>
                                        <Textarea
                                            id="description"
                                            rows={3}
                                            placeholder="Penjelasan latar belakang dan tujuan project..."
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-border text-sm focus-visible:ring-ring/30"
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-danger">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Row 3: Dates */}
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="start_date"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                Tanggal Mulai
                                            </Label>
                                            <DatePicker
                                                value={data.start_date}
                                                onChange={(val) =>
                                                    setData('start_date', val)
                                                }
                                                placeholder="Pilih tanggal mulai"
                                            />
                                            {errors.start_date && (
                                                <p className="text-xs text-danger">
                                                    {errors.start_date}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="target_end_date"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                Tanggal Target Selesai
                                            </Label>
                                            <DatePicker
                                                value={data.target_end_date}
                                                onChange={(val) =>
                                                    setData(
                                                        'target_end_date',
                                                        val,
                                                    )
                                                }
                                                placeholder="Pilih tanggal target selesai"
                                            />
                                            {errors.target_end_date && (
                                                <p className="text-xs text-danger">
                                                    {errors.target_end_date}
                                                </p>
                                            )}
                                        </div>

                                        {isExistingSystem && (
                                            <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2 lg:col-span-3">
                                                Tanggal historis bersifat
                                                opsional. Kosongkan jika data
                                                mulai atau target selesai tidak
                                                tersedia.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assigned Developers Card - Full Width */}
                            <Card className="w-full gap-0 border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                        <IconUsers className="size-5 text-primary" />
                                        <span>Anggota Tim</span>
                                    </CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Pilih anggota tim yang bertugas
                                        mengembangkan dan mengelola project ini.
                                        User yang dipilih dapat mengelola brief
                                        feature di dalamnya.
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {available_users.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {available_users.map((u) => {
                                                const isSelected =
                                                    data.user_ids.includes(
                                                        u.id,
                                                    );
                                                const isAdminRole =
                                                    u.role === 'admin';

                                                return (
                                                    <label
                                                        key={u.id}
                                                        htmlFor={`project-user-${u.id}`}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-background-soft shadow-xs'
                                                                : 'border-border bg-background hover:bg-background-soft/40'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            id={`project-user-${u.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                handleUserToggle(
                                                                    u.id,
                                                                )
                                                            }
                                                            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                                        />
                                                        <div className="flex min-w-0 flex-1 flex-col">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="truncate text-xs font-semibold text-foreground">
                                                                    {u.name}
                                                                </span>
                                                                {isAdminRole ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="shrink-0 border-primary/30 bg-primary-surface px-2 py-0.5 text-xs text-primary"
                                                                    >
                                                                        Admin
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="shrink-0 border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                                                    >
                                                                        User
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                {u.email}
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="py-4 text-center text-xs text-muted-foreground italic">
                                            Belum ada anggota tim terdaftar di
                                            sistem.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Brief Features Section - Full Width */}
                            <Card className="w-full gap-0 border-border bg-card shadow-xs">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            Brief Features Awal (Opsional)
                                        </CardTitle>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Daftarkan fitur utama dari brief
                                            awal untuk menghitung persentase
                                            realisasinya.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddBriefFeature}
                                        className="h-8 gap-1.5 border-border text-xs hover:bg-background-soft"
                                    >
                                        <IconPlus className="size-3.5" />
                                        <span>Tambah Brief Feature</span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3 pt-6">
                                    {data.brief_features.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {data.brief_features.map(
                                                (feat, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 rounded-lg border border-border bg-background-soft/50 p-3"
                                                    >
                                                        <span className="w-6 text-center text-xs font-bold text-muted-foreground tabular-nums">
                                                            #{index + 1}
                                                        </span>
                                                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                                                            <Input
                                                                placeholder="Nama Brief Feature..."
                                                                value={
                                                                    feat.name
                                                                }
                                                                onChange={(e) =>
                                                                    handleBriefFeatureChange(
                                                                        index,
                                                                        'name',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-9 border-border bg-background text-xs"
                                                            />
                                                            <Input
                                                                placeholder="Deskripsi Brief Feature (opsional)..."
                                                                value={
                                                                    feat.description
                                                                }
                                                                onChange={(e) =>
                                                                    handleBriefFeatureChange(
                                                                        index,
                                                                        'description',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-9 border-border bg-background text-xs"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleRemoveBriefFeature(
                                                                    index,
                                                                )
                                                            }
                                                            className="size-8 shrink-0 text-muted-foreground hover:bg-danger-surface hover:text-danger"
                                                        >
                                                            <IconTrash className="size-4" />
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-border bg-background-soft/30 py-6 text-center">
                                            <p className="text-xs text-muted-foreground">
                                                Belum ada brief feature awal.
                                                Tambahkan sekarang atau kelola
                                                nanti di halaman Detail Project.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Form Action Footer */}
                            <div className="flex items-center justify-end gap-3 pb-6">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 border-border text-xs md:h-9"
                                >
                                    <Link href="/projects">Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 gap-1.5 bg-primary text-xs text-primary-foreground shadow-xs hover:bg-primary-hover md:h-9"
                                >
                                    <IconCheck className="size-4" />
                                    <span>Simpan Project</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </SidebarInset>
            </SidebarProvider>
            {unsavedChangesDialog}
        </>
    );
}
