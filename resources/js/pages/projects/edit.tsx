import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconCheck, IconUsers } from '@tabler/icons-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { DatePicker } from '@/components/ui/date-picker';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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
    const { data, setData, put, processing, errors } = useForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        target_end_date: project.target_end_date ? project.target_end_date.split('T')[0] : '',
        actual_end_date: project.actual_end_date ? project.actual_end_date.split('T')[0] : '',
        user_ids: assigned_user_ids,
    });

    const handleUserToggle = (userId: number) => {
        if (data.user_ids.includes(userId)) {
            setData('user_ids', data.user_ids.filter((id) => id !== userId));
        } else {
            setData('user_ids', [...data.user_ids, userId]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/projects/${project.id}`);
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

                    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0 w-full">
                        {/* Back Link & Header */}
                        <div className="flex items-center gap-3 pt-4 md:pt-2">
                            <Link href={`/projects/${project.id}`}>
                                <Button variant="outline" size="icon" className="size-8 border-[#E7DFD5] hover:bg-[#FAF7F2]">
                                    <IconArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#25211E]">
                                    Edit Data Project
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Perbarui nama, deskripsi, tanggal target, status lifecycle, atau penugasan tim pengembang project #{project.id}.
                                </p>
                            </div>
                        </div>

                        {/* Form Body - Full Width */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                            <Card className="border-[#E7DFD5] bg-card shadow-xs w-full">
                                <CardHeader className="border-b border-[#E7DFD5] pb-4">
                                    <CardTitle className="text-base font-semibold text-[#25211E]">
                                        Informasi Utama Project
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5 pt-6">
                                    {/* Row 1: Name & Status */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="name" className="text-xs font-semibold text-[#25211E]">
                                                Nama Project / Sistem <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="h-9 border-[#E7DFD5] focus-visible:ring-[#AF4424]/30 text-sm"
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="status" className="text-xs font-semibold text-[#25211E]">
                                                Status Lifecycle <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(val) => setData('status', val as any)}
                                            >
                                                <SelectTrigger className="h-9 border-[#E7DFD5] text-xs">
                                                    <SelectValue placeholder="Pilih Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((s) => (
                                                        <SelectItem key={s.value} value={s.value} className="text-xs">
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-xs text-red-600">{errors.status}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: Description */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="description" className="text-xs font-semibold text-[#25211E]">
                                            Deskripsi Ringkas
                                        </Label>
                                        <Textarea
                                            id="description"
                                            rows={4}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="border-[#E7DFD5] focus-visible:ring-[#AF4424]/30 text-sm"
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Row 3: Dates */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="start_date" className="text-xs font-semibold text-[#25211E]">
                                                Start Date
                                            </Label>
                                            <DatePicker
                                                value={data.start_date}
                                                onChange={(val) => setData('start_date', val)}
                                                placeholder="Pilih Start Date"
                                            />
                                            {errors.start_date && (
                                                <p className="text-xs text-red-600">{errors.start_date}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="target_end_date" className="text-xs font-semibold text-[#25211E]">
                                                Target End Date
                                            </Label>
                                            <DatePicker
                                                value={data.target_end_date}
                                                onChange={(val) => setData('target_end_date', val)}
                                                placeholder="Pilih Target End Date"
                                            />
                                            {errors.target_end_date && (
                                                <p className="text-xs text-red-600">{errors.target_end_date}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="actual_end_date" className="text-xs font-semibold text-[#25211E]">
                                                Actual End Date
                                            </Label>
                                            <DatePicker
                                                value={data.actual_end_date}
                                                onChange={(val) => setData('actual_end_date', val)}
                                                placeholder="Pilih Actual End Date"
                                            />
                                            {errors.actual_end_date && (
                                                <p className="text-xs text-red-600">{errors.actual_end_date}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assigned Developers Card - Full Width */}
                            <Card className="border-[#E7DFD5] bg-card shadow-xs w-full">
                                <CardHeader className="border-b border-[#E7DFD5] pb-4">
                                    <CardTitle className="text-base font-semibold text-[#25211E] flex items-center gap-2">
                                        <IconUsers className="size-5 text-[#AF4424]" />
                                        <span>Tim Pengembang (Assigned Developers)</span>
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Pilih anggota tim yang bertugas meng-develop dan mengelola project ini.
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {available_users.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {available_users.map((u) => {
                                                const isSelected = data.user_ids.includes(u.id);
                                                const isAdminRole = u.role === 'admin';

                                                return (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => handleUserToggle(u.id)}
                                                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'border-[#AF4424] bg-[#FAF7F2] shadow-xs'
                                                                : 'border-[#E7DFD5] bg-background hover:bg-[#FAF7F2]/40'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleUserToggle(u.id)}
                                                            className="data-[state=checked]:bg-[#AF4424] data-[state=checked]:border-[#AF4424]"
                                                        />
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="text-xs font-semibold text-[#25211E] truncate">
                                                                    {u.name}
                                                                </span>
                                                                {isAdminRole ? (
                                                                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-[#AF4424]/30 text-[#AF4424] bg-[#AF4424]/10 shrink-0">
                                                                        Admin
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-border text-muted-foreground bg-muted shrink-0">
                                                                        User
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground truncate mt-0.5">
                                                                {u.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic text-center py-4">
                                            Belum ada anggota tim terdaftar di sistem.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Form Action Footer */}
                            <div className="flex items-center justify-end gap-3 pb-6">
                                <Link href={`/projects/${project.id}`}>
                                    <Button type="button" variant="outline" className="h-9 border-[#E7DFD5] text-xs">
                                        Batal
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-9 gap-1.5 bg-[#AF4424] text-white hover:bg-[#8C361D] text-xs shadow-xs"
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
