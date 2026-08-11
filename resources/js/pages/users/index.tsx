import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    IconArchive,
    IconArchiveOff,
    IconChevronLeft,
    IconChevronRight,
    IconDots,
    IconPencil,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconSearchOff,
    IconShieldCheck,
    IconUserCheck,
    IconUserShield,
    IconX,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from '@/components/ui/pagination';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatAppDateOnly } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { UserFormModal } from '@/pages/users/user-form-modal';
import type { User } from '@/types/auth';

export interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface UsersPageProps {
    users: PaginatedUsers;
    filters: {
        search: string;
        role: string;
        status: string;
    };
}

export default function UsersIndex({ users, filters }: UsersPageProps) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const currentUser = auth?.user;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState<string>(filters.role || 'all');
    const [statusFilter, setStatusFilter] = useState<string>(
        filters.status || 'all',
    );

    // Debounce timer for search
    const isFirstRender = useRef(true);

    const applyFilters = (search: string, role: string, status: string) => {
        router.get(
            '/users',
            {
                search: search || undefined,
                role: role !== 'all' ? role : undefined,
                status: status !== 'all' ? status : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Handle search debounce
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            applyFilters(searchQuery, roleFilter, statusFilter);
        }, 300);

        return () => clearTimeout(timer);
        // Role and status changes apply immediately; only the free-text search is debounced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Handle instant filter selects
    const handleRoleChange = (value: string) => {
        setRoleFilter(value);
        applyFilters(searchQuery, value, statusFilter);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        applyFilters(searchQuery, roleFilter, value);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setRoleFilter('all');
        setStatusFilter('all');
        router.get('/users', {}, { preserveState: true, replace: true });
    };

    // State for Create & Edit User Modal
    const [userModal, setUserModal] = useState<{
        open: boolean;
        user?: User | null;
    }>({
        open: false,
        user: null,
    });

    // State for Custom Shadcn Confirm Dialog
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
        confirmText: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'warning',
        confirmText: '',
        onConfirm: () => {},
    });

    const hasActiveFilter =
        searchQuery.trim() !== '' ||
        roleFilter !== 'all' ||
        statusFilter !== 'all';

    const handleSoftDelete = (user: User) => {
        setConfirmState({
            open: true,
            title: `Nonaktifkan Akun ${user.name}?`,
            description: `User tidak akan dapat login lagi ke sistem. Seluruh histori pekerjaan dan laporan OKR tetap tersimpan aman.`,
            variant: 'danger',
            confirmText: 'Ya, Nonaktifkan Akun',
            onConfirm: () => {
                router.delete(`/users/${user.id}`, {
                    preserveScroll: true,
                });
            },
        });
    };

    const handleRestore = (user: User) => {
        setConfirmState({
            open: true,
            title: `Aktifkan Kembali Akun ${user.name}?`,
            description: `User akan kembali dapat login dan mengakses seluruh fitur di sistem Project Tracker.`,
            variant: 'success',
            confirmText: 'Ya, Aktifkan Akun',
            onConfirm: () => {
                router.post(
                    `/users/${user.id}/restore`,
                    {},
                    {
                        preserveScroll: true,
                    },
                );
            },
        });
    };

    const prevLink = users.links[0]?.url;
    const nextLink = users.links[users.links.length - 1]?.url;

    return (
        <>
            <Head title="Kelola User — System Management" />
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
                    <SiteHeader title="Kelola User" />

                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0">
                        {/* Page Header */}
                        <div className="flex flex-col gap-1 pt-4 md:pt-2">
                            <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                Manajemen User dan Akses
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Atur anggota tim, peran akses, dan status akun
                                pengguna.
                            </p>
                        </div>

                        {/* Toolbar: Search + Filters + Action */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                                {/* Search Input */}
                                <div className="relative max-w-sm flex-1">
                                    <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        aria-label="Cari user"
                                        placeholder="Cari nama, email, atau ID user..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="h-9 border-border bg-background pr-8 pl-9 text-sm focus-visible:ring-ring/30"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            aria-label="Hapus pencarian user"
                                            onClick={() => {
                                                setSearchQuery('');
                                                applyFilters(
                                                    '',
                                                    roleFilter,
                                                    statusFilter,
                                                );
                                            }}
                                            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <IconX className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Role Filter */}
                                <Select
                                    value={roleFilter}
                                    onValueChange={handleRoleChange}
                                >
                                    <SelectTrigger
                                        aria-label="Filter peran akses"
                                        className="h-11 w-full border-border bg-background text-sm sm:w-[150px] lg:h-9"
                                    >
                                        <SelectValue placeholder="Semua Peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Peran
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admin
                                        </SelectItem>
                                        <SelectItem value="user">
                                            User
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Status Filter */}
                                <Select
                                    value={statusFilter}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger
                                        aria-label="Filter status akun"
                                        className="h-11 w-full border-border bg-background text-sm sm:w-[160px] lg:h-9"
                                    >
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Status
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="archived">
                                            Nonaktif (Diarsip)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {hasActiveFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="h-11 self-start text-xs text-muted-foreground hover:text-foreground sm:self-auto lg:h-9"
                                    >
                                        <IconX className="mr-1 size-3" />
                                        Reset Filter
                                    </Button>
                                )}
                            </div>

                            {/* Create User Button */}
                            <Button
                                size="sm"
                                className="h-11 gap-1.5 bg-primary font-medium text-primary-foreground shadow-xs hover:bg-primary-hover lg:h-9"
                                onClick={() =>
                                    setUserModal({ open: true, user: null })
                                }
                            >
                                <IconPlus className="size-4" />
                                <span>Tambah User</span>
                            </Button>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Pengguna
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Email
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Peran Akses
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                                            Tanggal Join
                                        </TableHead>
                                        <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.length > 0 ? (
                                        users.data.map((u) => {
                                            const isAdmin = u.role === 'admin';
                                            const isArchived = !!u.deleted_at;
                                            const isSelf =
                                                currentUser?.id === u.id;

                                            return (
                                                <TableRow
                                                    key={u.id}
                                                    className={`border-border transition-colors ${
                                                        isArchived
                                                            ? 'opacity-60'
                                                            : ''
                                                    }`}
                                                >
                                                    {/* User Name */}
                                                    <TableCell>
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span
                                                                className={`truncate text-sm font-medium ${
                                                                    isArchived
                                                                        ? 'text-muted-foreground line-through'
                                                                        : 'text-foreground'
                                                                }`}
                                                            >
                                                                {u.name}
                                                            </span>
                                                            {isSelf && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="shrink-0 border-primary/20 bg-primary-surface px-1.5 py-0 text-xs font-medium text-primary"
                                                                >
                                                                    Akun Anda
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Email */}
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {u.email}
                                                    </TableCell>

                                                    {/* Role */}
                                                    <TableCell>
                                                        {isAdmin ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 rounded-md border-primary/20 bg-primary-surface px-2 py-0.5 text-xs font-medium text-primary"
                                                            >
                                                                <IconUserShield className="size-3" />
                                                                Administrator
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 rounded-md border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                                                            >
                                                                <IconUserCheck className="size-3" />
                                                                User
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell>
                                                        {isArchived ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 rounded-md border-warning/20 bg-warning-surface px-2 py-0.5 text-xs font-medium text-warning"
                                                            >
                                                                <IconArchive className="size-3" />
                                                                Diarsip
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 rounded-md border-success/20 bg-success-surface px-2 py-0.5 text-xs font-medium text-success"
                                                            >
                                                                <IconShieldCheck className="size-3" />
                                                                Aktif
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    {/* Date */}
                                                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                        {u.created_at
                                                            ? formatAppDateOnly(
                                                                  u.created_at,
                                                              )
                                                            : '-'}
                                                    </TableCell>

                                                    {/* Inline Actions */}
                                                    <TableCell className="text-right">
                                                        <TooltipProvider>
                                                            <div className="flex items-center justify-end gap-1">
                                                                {/* Edit User Button */}
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-11 text-muted-foreground hover:bg-muted hover:text-foreground lg:size-8"
                                                                            onClick={() =>
                                                                                setUserModal(
                                                                                    {
                                                                                        open: true,
                                                                                        user: u,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <IconPencil className="size-4" />
                                                                            <span className="sr-only">
                                                                                Edit
                                                                                User
                                                                            </span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Edit
                                                                        User
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                {/* Restore or Archive Button */}
                                                                {isArchived ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="size-11 text-success hover:bg-success-surface hover:text-success lg:size-8"
                                                                                onClick={() =>
                                                                                    handleRestore(
                                                                                        u,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <IconRefresh className="size-4" />
                                                                                <span className="sr-only">
                                                                                    Aktifkan
                                                                                    Kembali
                                                                                </span>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Aktifkan
                                                                            Akun
                                                                            Kembali
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip>
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="size-11 text-muted-foreground hover:bg-danger-surface hover:text-danger disabled:pointer-events-none disabled:opacity-40 lg:size-8"
                                                                                disabled={
                                                                                    isSelf
                                                                                }
                                                                                onClick={() =>
                                                                                    !isSelf &&
                                                                                    handleSoftDelete(
                                                                                        u,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <IconArchiveOff className="size-4" />
                                                                                <span className="sr-only">
                                                                                    Nonaktifkan
                                                                                    Akun
                                                                                </span>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            {isSelf
                                                                                ? 'Tidak bisa menonaktifkan akun sendiri'
                                                                                : 'Nonaktifkan Akun'}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        /* Empty State */
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-48 text-center"
                                            >
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-2">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                        <IconSearchOff className="size-5" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        User Tidak Ditemukan
                                                    </h3>
                                                    <p className="text-center text-xs leading-normal text-muted-foreground">
                                                        Tidak ada data user yang
                                                        cocok dengan kriteria
                                                        pencarian atau filter
                                                        saat ini.
                                                    </p>
                                                    {hasActiveFilter && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleResetFilters
                                                            }
                                                            className="mt-1 h-8 text-xs"
                                                        >
                                                            Reset Filter
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Table footer count & pagination */}
                            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground tabular-nums">
                                    Menampilkan{' '}
                                    <span className="font-medium text-foreground">
                                        {users.from || 0}–{users.to || 0}
                                    </span>{' '}
                                    dari total {users.total} user
                                </p>

                                {/* Clean Shadcn Pagination */}
                                {users.last_page > 1 && (
                                    <Pagination className="mx-0 w-auto">
                                        <PaginationContent>
                                            {/* Previous Link */}
                                            <PaginationItem>
                                                <Link
                                                    href={prevLink || '#'}
                                                    preserveState
                                                    preserveScroll
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: 'ghost',
                                                            size: 'default',
                                                        }),
                                                        'h-11 gap-1 px-2.5 text-xs sm:pl-2.5 lg:h-8',
                                                        !prevLink &&
                                                            'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <IconChevronLeft className="size-4" />
                                                    <span className="hidden sm:block">
                                                        Sebelumnya
                                                    </span>
                                                </Link>
                                            </PaginationItem>

                                            {/* Page Number Links */}
                                            {users.links
                                                .slice(1, -1)
                                                .map((link, idx) => {
                                                    if (link.label === '...') {
                                                        return (
                                                            <PaginationItem
                                                                key={idx}
                                                            >
                                                                <span className="flex size-8 items-center justify-center text-muted-foreground">
                                                                    <IconDots className="size-4" />
                                                                </span>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return (
                                                        <PaginationItem
                                                            key={idx}
                                                        >
                                                            <Link
                                                                href={
                                                                    link.url ||
                                                                    '#'
                                                                }
                                                                preserveState
                                                                preserveScroll
                                                                className={cn(
                                                                    buttonVariants(
                                                                        {
                                                                            variant:
                                                                                link.active
                                                                                    ? 'outline'
                                                                                    : 'ghost',
                                                                            size: 'icon',
                                                                        },
                                                                    ),
                                                                    'size-11 h-11 text-xs font-medium lg:size-8 lg:h-8',
                                                                )}
                                                            >
                                                                {link.label}
                                                            </Link>
                                                        </PaginationItem>
                                                    );
                                                })}

                                            {/* Next Link */}
                                            <PaginationItem>
                                                <Link
                                                    href={nextLink || '#'}
                                                    preserveState
                                                    preserveScroll
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: 'ghost',
                                                            size: 'default',
                                                        }),
                                                        'h-11 gap-1 px-2.5 text-xs sm:pr-2.5 lg:h-8',
                                                        !nextLink &&
                                                            'pointer-events-none opacity-40',
                                                    )}
                                                >
                                                    <span className="hidden sm:block">
                                                        Berikutnya
                                                    </span>
                                                    <IconChevronRight className="size-4" />
                                                </Link>
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Create / Edit User Modal */}
            <UserFormModal
                open={userModal.open}
                onOpenChange={(open) =>
                    setUserModal((prev) => ({ ...prev, open }))
                }
                user={userModal.user}
            />

            {/* Custom Shadcn SweetAlert-Style Confirm Dialog */}
            <ConfirmDialog
                open={confirmState.open}
                onOpenChange={(open) =>
                    setConfirmState((prev) => ({ ...prev, open }))
                }
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
                onConfirm={confirmState.onConfirm}
            />
        </>
    );
}
