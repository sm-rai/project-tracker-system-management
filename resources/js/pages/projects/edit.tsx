import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconCheck, IconUsers } from '@tabler/icons-react';
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
import type { Project } from '@/types/project';

interface EditProjectProps {
    project: Project;
    statuses: Array<{ value: string; label: string }>;
    available_users?: User[];
    assigned_user_ids?: number[];
}

export default function EditProject({
    project,
    statuses,
    available_users = [],
    assigned_user_ids = [],
}: EditProjectProps) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        target_end_date: project.target_end_date
            ? project.target_end_date.split('T')[0]
            : '',
        actual_end_date: project.actual_end_date
            ? project.actual_end_date.split('T')[0]
            : '',
        user_ids: assigned_user_ids,
    });
    const { markSubmitting, markFinished } = useUnsavedChanges(isDirty);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        markSubmitting();
        put(`/projects/${project.id}`, { onFinish: markFinished });
    };

    return (
        <>
            <Head title={`Edit ${project.name} — System Management`} />
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
                    <SiteHeader title="Edit Project" />

                    <div className="flex w-full flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
                        {/* Back Link & Header */}
                        <div className="flex items-center gap-3 pt-4 md:pt-2">
                            <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="size-11 border-border hover:bg-background-soft md:size-8"
                            >
                                <Link href={`/projects/${project.id}`}>
                                    <span className="sr-only">
                                        Kembali ke detail project
                                    </span>
                                    <IconArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Edit Project
                                </h1>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Perbarui informasi, status lifecycle,
                                    tanggal target, atau anggota tim untuk
                                    project #{project.id}.
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
                                ditandai sebelum menyimpan perubahan.
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="flex w-full flex-col gap-6"
                        >
                            <Card className="w-full border-border bg-card shadow-xs">
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
                                                    setData(
                                                        'status',
                                                        val as any,
                                                    )
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
                                            rows={4}
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
                                    <div className="grid gap-4 sm:grid-cols-3">
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

                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="actual_end_date"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                Tanggal Selesai Aktual
                                            </Label>
                                            <DatePicker
                                                value={data.actual_end_date}
                                                onChange={(val) =>
                                                    setData(
                                                        'actual_end_date',
                                                        val,
                                                    )
                                                }
                                                placeholder="Pilih tanggal selesai aktual"
                                            />
                                            {errors.actual_end_date && (
                                                <p className="text-xs text-danger">
                                                    {errors.actual_end_date}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assigned Developers Card - Full Width */}
                            <Card className="w-full border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                        <IconUsers className="size-5 text-primary" />
                                        <span>Anggota Tim</span>
                                    </CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Pilih anggota tim yang bertugas
                                        mengembangkan dan mengelola project ini.
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

                            {/* Form Action Footer */}
                            <div className="flex items-center justify-end gap-3 pb-6">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 border-border text-xs md:h-9"
                                >
                                    <Link href={`/projects/${project.id}`}>
                                        Batal
                                    </Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 gap-1.5 bg-primary text-xs text-primary-foreground shadow-xs hover:bg-primary-hover md:h-9"
                                >
                                    <IconCheck className="size-4" />
                                    <span>Simpan Perubahan</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
