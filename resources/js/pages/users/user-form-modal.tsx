import { useForm } from '@inertiajs/react';
import {
    IconCheck,
    IconPencil,
    IconUserCheck,
    IconUserPlus,
    IconUserShield,
} from '@tabler/icons-react';
import type { FormEvent} from 'react';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import type { User } from '@/types/auth';

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
}

export function UserFormModal({
    open,
    onOpenChange,
    user,
}: UserFormModalProps) {
    const isEdit = !!user;

    const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
        isDirty,
    } = useForm({
        name: '',
        email: '',
        role: 'user',
        password: '',
    });

    useEffect(() => {
        if (open) {
            clearErrors();

            if (user) {
                setData({
                    name: user.name || '',
                    email: user.email || '',
                    role: user.role || 'user',
                    password: '',
                });
            } else {
                reset();
            }
        }
    }, [clearErrors, open, reset, setData, user]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEdit && user) {
            put(`/users/${user.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    const requestOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && isDirty && !processing) {
            setDiscardConfirmOpen(true);

            return;
        }

        onOpenChange(nextOpen);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={requestOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader className="border-b border-border pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary-surface text-primary">
                                {isEdit ? (
                                    <IconPencil className="size-5" />
                                ) : (
                                    <IconUserPlus className="size-5" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold text-foreground">
                                    {isEdit
                                        ? `Edit User: ${user.name}`
                                        : 'Tambah User'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    {isEdit
                                        ? 'Perbarui nama lengkap, email, atau tingkat hak akses pengguna.'
                                        : 'Daftarkan anggota tim baru untuk mengakses Project Tracker.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        {/* Name Field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="modal-name"
                                className="text-xs font-medium text-foreground"
                            >
                                Nama Lengkap
                            </Label>
                            <Input
                                id="modal-name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Contoh: Budi Santoso"
                                className="h-9 border-border bg-background text-sm focus-visible:ring-ring/30"
                                required
                                autoFocus
                                aria-invalid={Boolean(errors.name)}
                                aria-describedby={
                                    errors.name ? 'modal-name-error' : undefined
                                }
                            />
                            {errors.name && (
                                <p
                                    id="modal-name-error"
                                    className="text-xs font-medium text-danger"
                                >
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="modal-email"
                                className="text-xs font-medium text-foreground"
                            >
                                Alamat Email
                            </Label>
                            <Input
                                id="modal-email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="user@rumahatsiri.com"
                                className="h-9 border-border bg-background text-sm focus-visible:ring-ring/30"
                                required
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={
                                    errors.email
                                        ? 'modal-email-error'
                                        : undefined
                                }
                            />
                            {errors.email && (
                                <p
                                    id="modal-email-error"
                                    className="text-xs font-medium text-danger"
                                >
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Role Access Field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="modal-role"
                                className="text-xs font-medium text-foreground"
                            >
                                Peran Akses
                            </Label>
                            <Select
                                value={data.role}
                                onValueChange={(val) =>
                                    setData('role', val as 'admin' | 'user')
                                }
                            >
                                <SelectTrigger
                                    id="modal-role"
                                    aria-invalid={Boolean(errors.role)}
                                    aria-describedby={
                                        errors.role
                                            ? 'modal-role-error'
                                            : undefined
                                    }
                                    className="h-9 w-full border-border bg-background text-sm"
                                >
                                    <SelectValue placeholder="Pilih peran akses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <IconUserShield className="size-3.5 text-primary" />
                                            <span>
                                                Administrator — Akses Penuh
                                                Sistem
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="user">
                                        <div className="flex items-center gap-2">
                                            <IconUserCheck className="size-3.5 text-muted-foreground" />
                                            <span>User — Akses standar</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p
                                    id="modal-role-error"
                                    className="text-xs font-medium text-danger"
                                >
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5 pt-1">
                            <Label
                                htmlFor="modal-password"
                                className="text-xs font-medium text-foreground"
                            >
                                {isEdit ? (
                                    <>
                                        Password Baru{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (Opsional)
                                        </span>
                                    </>
                                ) : (
                                    'Password Awal'
                                )}
                            </Label>
                            <Input
                                id="modal-password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder={
                                    isEdit
                                        ? 'Biarkan kosong jika password tidak diubah'
                                        : 'Minimal 8 karakter'
                                }
                                className="h-9 border-border bg-background text-sm focus-visible:ring-ring/30"
                                required={!isEdit}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={
                                    errors.password
                                        ? 'modal-password-error'
                                        : undefined
                                }
                            />
                            {errors.password && (
                                <p
                                    id="modal-password-error"
                                    className="text-xs font-medium text-danger"
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => requestOpenChange(false)}
                                className="h-11 border-border text-xs font-medium hover:bg-muted md:h-9"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={processing}
                                className="h-11 gap-1.5 bg-primary font-medium text-primary-foreground shadow-xs hover:bg-primary-hover md:h-9"
                            >
                                <IconCheck className="size-4" />
                                <span>
                                    {processing
                                        ? 'Menyimpan...'
                                        : isEdit
                                          ? 'Simpan Perubahan'
                                          : 'Simpan User Baru'}
                                </span>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={discardConfirmOpen}
                onOpenChange={setDiscardConfirmOpen}
                title="Batalkan perubahan user?"
                description="Perubahan yang belum disimpan akan hilang."
                confirmText="Buang Perubahan"
                variant="warning"
                onConfirm={() => {
                    setDiscardConfirmOpen(false);
                    onOpenChange(false);
                }}
            />
        </>
    );
}
