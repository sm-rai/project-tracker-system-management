import { Head, Link, router } from '@inertiajs/react';
import {
    IconAlertCircle,
    IconArrowLeft,
    IconCheck,
    IconChecklist,
    IconPencil,
    IconPlus,
    IconTrash,
} from '@tabler/icons-react';
import React, { useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BriefFeatureStatusBadge } from '@/components/projects/brief-feature-status-badge';
import { ProgressBar } from '@/components/projects/progress-bar';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFlashToast } from '@/hooks/use-flash-toast';
import {
    create as featureRequestCreate,
    show as featureRequestShow,
} from '@/routes/feature-requests';
import { create as issueCreate, show as issueShow } from '@/routes/issues';
import type {
    BriefFeature,
    BriefFeatureStatusType,
    Project,
} from '@/types/project';

interface ProjectShowProps {
    project: Project;
    is_deployed: boolean;
    brief_feature_statuses: Array<{ value: string; label: string }>;
    project_statuses: Array<{ value: string; label: string }>;
}

export default function ProjectShow({
    project,
    is_deployed,
    brief_feature_statuses,
    project_statuses,
}: ProjectShowProps) {
    useFlashToast();

    // State for Add Brief Feature Modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newFeatureName, setNewFeatureName] = useState('');
    const [newFeatureDesc, setNewFeatureDesc] = useState('');
    const [newFeatureStatus, setNewFeatureStatus] =
        useState<BriefFeatureStatusType>('todo');

    // State for Edit Brief Feature Modal
    const [editModalState, setEditModalState] = useState<{
        open: boolean;
        feature?: BriefFeature | null;
    }>({ open: false, feature: null });

    const [editFeatureName, setEditFeatureName] = useState('');
    const [editFeatureDesc, setEditFeatureDesc] = useState('');
    const [editFeatureStatus, setEditFeatureStatus] =
        useState<BriefFeatureStatusType>('todo');

    // State for Delete Brief Feature Confirm
    const [confirmDeleteState, setConfirmDeleteState] = useState<{
        open: boolean;
        feature?: BriefFeature | null;
    }>({ open: false, feature: null });

    // Handle Quick Inline Status Toggle
    const handleStatusToggle = (
        feature: BriefFeature,
        newStatus: BriefFeatureStatusType,
    ) => {
        router.patch(
            `/brief-features/${feature.id}/status`,
            { status: newStatus },
            { preserveScroll: true },
        );
    };

    // Handle Quick Project Status Update
    const handleProjectStatusUpdate = (newStatus: string) => {
        router.put(
            `/projects/${project.id}`,
            {
                name: project.name,
                description: project.description,
                status: newStatus,
                start_date: project.start_date,
                target_end_date: project.target_end_date,
                actual_end_date: project.actual_end_date,
            },
            { preserveScroll: true },
        );
    };

    // Handle Add Brief Feature Submit
    const handleAddFeatureSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newFeatureName.trim()) {
return;
}

        router.post(
            `/projects/${project.id}/brief-features`,
            {
                name: newFeatureName,
                description: newFeatureDesc,
                status: newFeatureStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddModalOpen(false);
                    setNewFeatureName('');
                    setNewFeatureDesc('');
                    setNewFeatureStatus('todo');
                },
            },
        );
    };

    // Handle Edit Brief Feature Submit
    const handleEditFeatureSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editModalState.feature || !editFeatureName.trim()) {
return;
}

        router.put(
            `/brief-features/${editModalState.feature.id}`,
            {
                name: editFeatureName,
                description: editFeatureDesc,
                status: editFeatureStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditModalState({ open: false, feature: null });
                },
            },
        );
    };

    // Open Edit Modal helper
    const openEditModal = (feature: BriefFeature) => {
        setEditModalState({ open: true, feature });
        setEditFeatureName(feature.name);
        setEditFeatureDesc(feature.description || '');
        setEditFeatureStatus(feature.status);
    };

    // Handle Delete Brief Feature
    const handleDeleteFeature = () => {
        if (confirmDeleteState.feature) {
            router.delete(`/brief-features/${confirmDeleteState.feature.id}`, {
                preserveScroll: true,
            });
        }
    };

    const briefFeatures = project.brief_features || [];
    const doneFeaturesCount = briefFeatures.filter(
        (f) => f.status === 'done',
    ).length;

    return (
        <>
            <Head title={`${project.name} — System Management`} />
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
                    <SiteHeader title="Detail Project" />

                    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
                        {/* Back & Breadcrumb Header */}
                        <div className="flex items-center justify-between pt-4 md:pt-2">
                            <div className="flex items-center gap-3">
                                <Link href="/projects">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-8 border-[#E7DFD5] hover:bg-[#FAF7F2]"
                                    >
                                        <IconArrowLeft className="size-4" />
                                    </Button>
                                </Link>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold tracking-tight text-[#25211E]">
                                            {project.name}
                                        </h1>
                                        <ProjectStatusBadge
                                            status={project.status}
                                        />
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        ID Project #{project.id} • Dibuat oleh{' '}
                                        {project.creator?.name || 'Admin'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/projects/${project.id}/edit`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 border-[#E7DFD5] text-xs hover:bg-[#FAF7F2]"
                                    >
                                        <IconPencil className="size-3.5" />
                                        <span>Edit Project</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Top Overview Cards: Info & Realization */}
                        <div className="grid gap-5 lg:grid-cols-3">
                            {/* Project Overview Card */}
                            <Card className="border-[#E7DFD5] bg-card shadow-xs lg:col-span-2">
                                <CardHeader className="border-b border-[#E7DFD5] pb-3">
                                    <CardTitle className="flex items-center justify-between text-sm font-semibold text-[#25211E]">
                                        <span>Informasi Ringkas Project</span>
                                        {/* Quick Status Dropdown */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Ubah Status:
                                            </span>
                                            <Select
                                                value={project.status}
                                                onValueChange={
                                                    handleProjectStatusUpdate
                                                }
                                            >
                                                <SelectTrigger className="h-7 w-[170px] border-[#E7DFD5] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {project_statuses.map(
                                                        (s) => (
                                                            <SelectItem
                                                                key={s.value}
                                                                value={s.value}
                                                                className="text-xs"
                                                            >
                                                                {s.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4 pt-4">
                                    <p className="text-sm leading-relaxed text-[#25211E]/90">
                                        {project.description || (
                                            <span className="text-muted-foreground italic">
                                                Belum ada deskripsi project.
                                            </span>
                                        )}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 border-t border-[#E7DFD5] pt-4 sm:grid-cols-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Start Date
                                            </p>
                                            <p className="mt-0.5 text-sm font-medium text-[#25211E] tabular-nums">
                                                {project.start_date
                                                    ? new Date(
                                                          project.start_date,
                                                      ).toLocaleDateString(
                                                          'id-ID',
                                                          {
                                                              day: 'numeric',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          },
                                                      )
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Target End Date
                                            </p>
                                            <p className="mt-0.5 text-sm font-medium text-[#25211E] tabular-nums">
                                                {project.target_end_date
                                                    ? new Date(
                                                          project.target_end_date,
                                                      ).toLocaleDateString(
                                                          'id-ID',
                                                          {
                                                              day: 'numeric',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          },
                                                      )
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Actual End Date
                                            </p>
                                            <p className="mt-0.5 text-sm font-medium text-[#25211E] tabular-nums">
                                                {project.actual_end_date
                                                    ? new Date(
                                                          project.actual_end_date,
                                                      ).toLocaleDateString(
                                                          'id-ID',
                                                          {
                                                              day: 'numeric',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          },
                                                      )
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Tim Developers
                                            </p>
                                            <div className="mt-1">
                                                {project.users &&
                                                project.users.length > 0 ? (
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {project.users.map(
                                                            (u) => (
                                                                <Badge
                                                                    key={u.id}
                                                                    variant="outline"
                                                                    className="gap-1 rounded-full border-[#E7DFD5] bg-[#FAF7F2] px-2 py-0.5 text-xs font-medium text-[#25211E]"
                                                                >
                                                                    <span className="flex size-4 items-center justify-center rounded-full bg-[#AF4424] text-[9px] font-bold text-white uppercase">
                                                                        {u.name.substring(
                                                                            0,
                                                                            1,
                                                                        )}
                                                                    </span>
                                                                    <span>
                                                                        {u.name}
                                                                    </span>
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Realization Metric Card */}
                            <Card className="border-[#E7DFD5] bg-[#FAF7F2]/60 shadow-xs">
                                <CardHeader className="border-b border-[#E7DFD5] pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs font-bold tracking-wider text-[#AF4424] uppercase">
                                            Realisasi Brief Fitur
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="border-[#AF4424]/20 bg-[#AF4424]/10 px-2 py-0.5 text-xs font-semibold text-[#AF4424]"
                                        >
                                            Persentase Realisasi
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4 pt-4">
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black tracking-tight text-[#25211E] tabular-nums">
                                                {project.realization_percentage}
                                                %
                                            </span>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="bg-[#E7DFD5]/40 text-xs font-semibold text-[#25211E] tabular-nums"
                                        >
                                            {doneFeaturesCount} /{' '}
                                            {briefFeatures.length} Done
                                        </Badge>
                                    </div>

                                    <ProgressBar
                                        value={project.realization_percentage}
                                        showLabel={false}
                                        size="lg"
                                    />

                                    <p className="border-t border-[#E7DFD5]/60 pt-2.5 text-xs leading-normal text-muted-foreground">
                                        Formula: (Jumlah brief feature{' '}
                                        <span className="font-semibold text-[#3F7A4A]">
                                            done
                                        </span>{' '}
                                        / Total brief feature) × 100
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Tabs: Brief Features vs Issue & Feature Requests */}
                        <Tabs defaultValue="briefs" className="w-full">
                            <TabsList className="border-[#E7DFD5] bg-[#FAF7F2]">
                                <TabsTrigger
                                    value="briefs"
                                    className="gap-2 text-xs"
                                >
                                    <IconChecklist className="size-4" />
                                    <span>
                                        Brief Features ({briefFeatures.length})
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="issues"
                                    disabled={!is_deployed}
                                    className="gap-2 text-xs disabled:opacity-50"
                                >
                                    <IconAlertCircle className="size-4" />
                                    <span>Kendala & Feature Requests</span>
                                    {!is_deployed && (
                                        <span className="text-xs text-muted-foreground">
                                            (Deployed Only)
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* Brief Features Tab Content */}
                            <TabsContent value="briefs" className="mt-4">
                                <Card className="border-[#E7DFD5] bg-card shadow-xs">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-[#E7DFD5] pb-3">
                                        <div>
                                            <CardTitle className="text-base font-semibold text-[#25211E]">
                                                Daftar Brief Features
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                Ubah status fitur secara cepat
                                                untuk memperbarui persentase
                                                realisasi secara instan.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setAddModalOpen(true)
                                            }
                                            className="h-8 gap-1.5 bg-[#AF4424] text-xs text-white shadow-xs hover:bg-[#8C361D]"
                                        >
                                            <IconPlus className="size-3.5" />
                                            <span>Tambah Feature Brief</span>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-[#E7DFD5] hover:bg-transparent">
                                                    <TableHead className="h-10 w-12 text-center text-xs font-semibold text-muted-foreground">
                                                        #
                                                    </TableHead>
                                                    <TableHead className="h-10 text-xs font-semibold text-muted-foreground">
                                                        Nama Feature Brief
                                                    </TableHead>
                                                    <TableHead className="h-10 text-xs font-semibold text-muted-foreground">
                                                        Quick Status Toggle
                                                    </TableHead>
                                                    <TableHead className="h-10 text-xs font-semibold text-muted-foreground">
                                                        Selesai Pada
                                                    </TableHead>
                                                    <TableHead className="h-10 text-right text-xs font-semibold text-muted-foreground">
                                                        Aksi
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {briefFeatures.length > 0 ? (
                                                    briefFeatures.map(
                                                        (feat, idx) => (
                                                            <TableRow
                                                                key={feat.id}
                                                                className="border-[#E7DFD5] hover:bg-[#FAF7F2]/50"
                                                            >
                                                                <TableCell className="text-center text-xs font-medium text-muted-foreground tabular-nums">
                                                                    {idx + 1}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span
                                                                            className={`text-sm font-medium ${feat.status === 'done' ? 'text-muted-foreground line-through' : 'text-[#25211E]'}`}
                                                                        >
                                                                            {
                                                                                feat.name
                                                                            }
                                                                        </span>
                                                                        {feat.description && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {
                                                                                    feat.description
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {/* Interactive Quick Status Select */}
                                                                    <Select
                                                                        value={
                                                                            feat.status
                                                                        }
                                                                        onValueChange={(
                                                                            val: BriefFeatureStatusType,
                                                                        ) =>
                                                                            handleStatusToggle(
                                                                                feat,
                                                                                val,
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="h-8 w-[140px] border-[#E7DFD5] text-xs">
                                                                            <SelectValue>
                                                                                <BriefFeatureStatusBadge
                                                                                    status={
                                                                                        feat.status
                                                                                    }
                                                                                />
                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {brief_feature_statuses.map(
                                                                                (
                                                                                    s,
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            s.value
                                                                                        }
                                                                                        value={
                                                                                            s.value
                                                                                        }
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {
                                                                                            s.label
                                                                                        }
                                                                                    </SelectItem>
                                                                                ),
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground tabular-nums">
                                                                    {feat.completed_at ? (
                                                                        <div className="flex items-center gap-1.5 text-[#3F7A4A]">
                                                                            <IconCheck className="size-3.5" />
                                                                            <span>
                                                                                {new Date(
                                                                                    feat.completed_at,
                                                                                ).toLocaleDateString(
                                                                                    'id-ID',
                                                                                    {
                                                                                        day: 'numeric',
                                                                                        month: 'short',
                                                                                        year: 'numeric',
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit',
                                                                                    },
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span>
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <TooltipProvider>
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <Tooltip>
                                                                                <TooltipTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="size-8 text-muted-foreground hover:bg-[#FAF7F2] hover:text-[#25211E]"
                                                                                        onClick={() =>
                                                                                            openEditModal(
                                                                                                feat,
                                                                                            )
                                                                                        }
                                                                                        aria-label={`Edit feature ${feat.name}`}
                                                                                    >
                                                                                        <IconPencil className="size-4" />
                                                                                        <span className="sr-only">
                                                                                            Edit
                                                                                            Feature
                                                                                        </span>
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="text-xs">
                                                                                    Edit
                                                                                    Fitur
                                                                                </TooltipContent>
                                                                            </Tooltip>

                                                                            <Tooltip>
                                                                                <TooltipTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                                                                        onClick={() =>
                                                                                            setConfirmDeleteState(
                                                                                                {
                                                                                                    open: true,
                                                                                                    feature:
                                                                                                        feat,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        aria-label={`Hapus feature ${feat.name}`}
                                                                                    >
                                                                                        <IconTrash className="size-4" />
                                                                                        <span className="sr-only">
                                                                                            Hapus
                                                                                            Feature
                                                                                        </span>
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="text-xs">
                                                                                    Hapus
                                                                                    Fitur
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </div>
                                                                    </TooltipProvider>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )
                                                ) : (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={5}
                                                            className="py-12 text-center"
                                                        >
                                                            <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 text-center">
                                                                <div className="flex size-12 items-center justify-center rounded-full border border-[#E7DFD5] bg-[#FAF7F2] text-[#AF4424] shadow-xs">
                                                                    <IconChecklist className="size-6" />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <h3 className="text-sm font-semibold text-[#25211E]">
                                                                        Belum
                                                                        Ada
                                                                        Brief
                                                                        Feature
                                                                    </h3>
                                                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                                                        Mulai
                                                                        tambahkan
                                                                        rincian
                                                                        fitur
                                                                        yang
                                                                        disepakati
                                                                        pada
                                                                        brief
                                                                        untuk
                                                                        memantau
                                                                        persentase
                                                                        realisasi
                                                                        project
                                                                        ini
                                                                        secara
                                                                        real-time.
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setAddModalOpen(
                                                                            true,
                                                                        )
                                                                    }
                                                                    className="mt-1 h-8 gap-1.5 bg-[#AF4424] text-xs text-white shadow-xs hover:bg-[#8C361D]"
                                                                >
                                                                    <IconPlus className="size-3.5" />
                                                                    <span>
                                                                        Tambah
                                                                        Feature
                                                                        Brief
                                                                        Pertama
                                                                    </span>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="issues" className="mt-4">
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <Card className="gap-0 border-[#E7DFD5] py-0">
                                        <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
                                            <CardTitle className="text-base">
                                                Issue terkait
                                            </CardTitle>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={issueCreate({
                                                        query: {
                                                            project_id:
                                                                project.id,
                                                        },
                                                    })}
                                                >
                                                    Catat Issue
                                                </Link>
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {(project.issues ?? []).length ===
                                            0 ? (
                                                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                                                    Belum ada issue untuk sistem
                                                    ini.
                                                </p>
                                            ) : (
                                                <div className="divide-y">
                                                    {(project.issues ?? []).map(
                                                        (issue) => (
                                                            <Link
                                                                key={issue.id}
                                                                href={issueShow(
                                                                    issue.id,
                                                                )}
                                                                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF7F2]"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium">
                                                                        {
                                                                            issue.title
                                                                        }
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                                        {
                                                                            issue.priority
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {
                                                                            issue.status
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <IconArrowLeft className="size-4 rotate-180 text-muted-foreground" />
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="gap-0 border-[#E7DFD5] py-0">
                                        <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
                                            <CardTitle className="text-base">
                                                Feature Request terkait
                                            </CardTitle>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={featureRequestCreate({
                                                        query: {
                                                            project_id:
                                                                project.id,
                                                        },
                                                    })}
                                                >
                                                    Catat Request
                                                </Link>
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {(project.feature_requests ?? [])
                                                .length === 0 ? (
                                                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                                                    Belum ada feature request
                                                    untuk sistem ini.
                                                </p>
                                            ) : (
                                                <div className="divide-y">
                                                    {(
                                                        project.feature_requests ??
                                                        []
                                                    ).map((request) => (
                                                        <Link
                                                            key={request.id}
                                                            href={featureRequestShow(
                                                                request.id,
                                                            )}
                                                            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF7F2]"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {
                                                                        request.title
                                                                    }
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                    {
                                                                        request.priority
                                                                    }{' '}
                                                                    ·{' '}
                                                                    {
                                                                        request.status
                                                                    }
                                                                </p>
                                                            </div>
                                                            <IconArrowLeft className="size-4 rotate-180 text-muted-foreground" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Modal Add Brief Feature */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="border-[#E7DFD5] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-[#25211E]">
                            Tambah Feature Brief
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleAddFeatureSubmit}
                        className="grid gap-4 py-2"
                    >
                        <div className="grid gap-2">
                            <Label
                                htmlFor="add_name"
                                className="text-xs font-semibold text-[#25211E]"
                            >
                                Nama Fitur{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="add_name"
                                placeholder="Contoh: Modul Export PDF Laporan"
                                value={newFeatureName}
                                onChange={(e) =>
                                    setNewFeatureName(e.target.value)
                                }
                                className="h-9 border-[#E7DFD5] focus-visible:ring-[#AF4424]/30"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="add_desc"
                                className="text-xs font-semibold text-[#25211E]"
                            >
                                Deskripsi Fitur (Opsional)
                            </Label>
                            <Textarea
                                id="add_desc"
                                rows={2}
                                placeholder="Rincian fitur..."
                                value={newFeatureDesc}
                                onChange={(e) =>
                                    setNewFeatureDesc(e.target.value)
                                }
                                className="border-[#E7DFD5] text-xs focus-visible:ring-[#AF4424]/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="add_status"
                                className="text-xs font-semibold text-[#25211E]"
                            >
                                Status Awal
                            </Label>
                            <Select
                                value={newFeatureStatus}
                                onValueChange={(val: BriefFeatureStatusType) =>
                                    setNewFeatureStatus(val)
                                }
                            >
                                <SelectTrigger className="h-9 border-[#E7DFD5]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {brief_feature_statuses.map((s) => (
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
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAddModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-[#AF4424] text-white hover:bg-[#8C361D]"
                            >
                                Simpan Fitur
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Brief Feature */}
            <Dialog
                open={editModalState.open}
                onOpenChange={(open) =>
                    setEditModalState((prev) => ({ ...prev, open }))
                }
            >
                <DialogContent className="border-[#E7DFD5] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-[#25211E]">
                            Edit Feature Brief
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleEditFeatureSubmit}
                        className="grid gap-4 py-2"
                    >
                        <div className="grid gap-2">
                            <Label
                                htmlFor="edit_name"
                                className="text-xs font-semibold text-[#25211E]"
                            >
                                Nama Fitur{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_name"
                                value={editFeatureName}
                                onChange={(e) =>
                                    setEditFeatureName(e.target.value)
                                }
                                className="h-9 border-[#E7DFD5] focus-visible:ring-[#AF4424]/30"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="edit_desc"
                                className="text-xs font-semibold text-[#25211E]"
                            >
                                Deskripsi Fitur (Opsional)
                            </Label>
                            <Textarea
                                id="edit_desc"
                                rows={2}
                                value={editFeatureDesc}
                                onChange={(e) =>
                                    setEditFeatureDesc(e.target.value)
                                }
                                className="border-[#E7DFD5] text-xs focus-visible:ring-[#AF4424]/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="edit_status"
                                className="text-xs font-semibold text-[#25211E]"
                            >
                                Status
                            </Label>
                            <Select
                                value={editFeatureStatus}
                                onValueChange={(val: BriefFeatureStatusType) =>
                                    setEditFeatureStatus(val)
                                }
                            >
                                <SelectTrigger className="h-9 border-[#E7DFD5]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {brief_feature_statuses.map((s) => (
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
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setEditModalState({
                                        open: false,
                                        feature: null,
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-[#AF4424] text-white hover:bg-[#8C361D]"
                            >
                                Update Fitur
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Brief Feature Dialog */}
            <ConfirmDialog
                open={confirmDeleteState.open}
                onOpenChange={(open) =>
                    setConfirmDeleteState((prev) => ({ ...prev, open }))
                }
                title={`Hapus Feature Brief "${confirmDeleteState.feature?.name || ''}"?`}
                description="Fitur ini akan dihapus dari project dan persentase realisasi akan dikalkulasi ulang secara otomatis."
                variant="danger"
                confirmText="Ya, Hapus Fitur"
                onConfirm={handleDeleteFeature}
            />
        </>
    );
}
