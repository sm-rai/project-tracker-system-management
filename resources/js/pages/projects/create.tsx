import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconArrowLeft,
    IconCalendar,
    IconCheck,
    IconPlus,
    IconTrash,
    IconUserCheck,
    IconUsers,
    IconUserShield,
} from '@tabler/icons-react';

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

interface CreateProjectProps {
    statuses: Array<{ value: string; label: string }>;
    available_users: User[];
}

interface BriefFeatureInput {
    name: string;
    description: string;
}

export default function CreateProject({ statuses, available_users = [] }: CreateProjectProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        status: 'planning',
        start_date: '',
        target_end_date: '',
        user_ids: [] as number[],
        brief_features: [] as BriefFeatureInput[],
    });

    const handleUserToggle = (userId: number) => {
        if (data.user_ids.includes(userId)) {
            setData('user_ids', data.user_ids.filter((id) => id !== userId));
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
        post('/projects');
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

                    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0 w-full">
                        {/* Back Link & Header */}
                        <div className="flex items-center gap-3 pt-4 md:pt-2">
                            <Link href="/projects">
                                <Button variant="outline" size="icon" className="size-8 border-[#E7DFD5] hover:bg-[#FAF7F2]">
                                    <IconArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#25211E]">
                                    Tambah Project / Sistem Baru
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Daftarkan project pengembangan atau sistem berjalan beserta penugasan tim pengembang (developer).
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
                                                placeholder="Contoh: POS ATSIRI / WMS Warehouse"
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
                                                onValueChange={(val) => setData('status', val)}
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
                                            rows={3}
                                            placeholder="Penjelasan latar belakang dan tujuan project..."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="border-[#E7DFD5] focus-visible:ring-[#AF4424]/30 text-sm"
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Row 3: Dates */}
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                        Pilih anggota tim yang bertugas meng-develop dan mengelola project ini. User yang di-assign memiliki akses kelola penuh atas brief feature di dalamnya.
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

                            {/* Brief Features Section - Full Width */}
                            <Card className="border-[#E7DFD5] bg-card shadow-xs w-full">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-[#E7DFD5] pb-4">
                                    <div>
                                        <CardTitle className="text-base font-semibold text-[#25211E]">
                                            Brief Features Awal (Opsional)
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Fitur-fitur utama yang direquest pada brief awal untuk dihitung persentase realisasinya.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddBriefFeature}
                                        className="h-8 gap-1.5 border-[#E7DFD5] text-xs hover:bg-[#FAF7F2]"
                                    >
                                        <IconPlus className="size-3.5" />
                                        <span>Tambah Baris Fitur</span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3 pt-6">
                                    {data.brief_features.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {data.brief_features.map((feat, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 rounded-lg border border-[#E7DFD5] bg-[#FAF7F2]/50 p-3"
                                                >
                                                    <span className="text-xs font-bold text-muted-foreground w-6 text-center tabular-nums">
                                                        #{index + 1}
                                                    </span>
                                                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                                                        <Input
                                                            placeholder="Nama Fitur Brief..."
                                                            value={feat.name}
                                                            onChange={(e) =>
                                                                handleBriefFeatureChange(index, 'name', e.target.value)
                                                            }
                                                            className="h-9 border-[#E7DFD5] bg-background text-xs"
                                                        />
                                                        <Input
                                                            placeholder="Deskripsi fitur (opsional)..."
                                                            value={feat.description}
                                                            onChange={(e) =>
                                                                handleBriefFeatureChange(
                                                                    index,
                                                                    'description',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="h-9 border-[#E7DFD5] bg-background text-xs"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveBriefFeature(index)}
                                                        className="size-8 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <IconTrash className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 border border-dashed border-[#E7DFD5] rounded-lg bg-[#FAF7F2]/30">
                                            <p className="text-xs text-muted-foreground">
                                                Belum ada brief feature awal. Kamu bisa menambahkan di atas atau menyusul pada halaman Detail Project.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Form Action Footer */}
                            <div className="flex items-center justify-end gap-3 pb-6">
                                <Link href="/projects">
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
                                    <span>Simpan Project</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
