import { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconArrowLeft,
    IconCheck,
    IconPencil,
    IconUserCheck,
    IconUserShield,
} from '@tabler/icons-react';

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
import { useFlashToast } from '@/hooks/use-flash-toast';
import type { User } from '@/types/auth';

interface EditUserPageProps {
    user: User;
    roles: string[];
}

export default function EditUser({ user }: EditUserPageProps) {
    useFlashToast();

    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        password: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <>
            <Head title={`Edit User: ${user.name} — System Management`} />
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
                    <SiteHeader title="Edit User" />

                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0">
                        <div className="mx-auto w-full max-w-2xl space-y-4">
                            {/* Page Top Header */}
                            <div className="flex items-center gap-3 pt-4 md:pt-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    asChild
                                    className="size-8 rounded-lg border-border bg-background hover:bg-muted"
                                >
                                    <Link href="/users">
                                        <IconArrowLeft className="size-4" />
                                        <span className="sr-only">Kembali ke Kelola User</span>
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                        Edit Profile User: {user.name}
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Perbarui nama lengkap, email, atau tingkat hak akses pengguna di sistem.
                                    </p>
                                </div>
                            </div>

                            {/* Direct Form Card */}
                            <Card className="border border-border bg-card shadow-xs">
                                <CardHeader className="border-b border-border pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary-surface text-primary">
                                            <IconPencil className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold text-foreground">
                                                Informasi Akun
                                            </CardTitle>
                                            <CardDescription className="text-xs text-muted-foreground">
                                                Perbarui profil akun dan simpan perubahan.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-medium text-foreground">
                                                Nama Lengkap
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Masukkan nama lengkap user"
                                                className="h-9 border-border bg-background text-sm focus-visible:ring-ring/30"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="text-xs font-medium text-danger">{errors.name}</p>
                                            )}
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-medium text-foreground">
                                                Alamat Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="user@rumahatsiri.com"
                                                className="h-9 border-border bg-background text-sm focus-visible:ring-ring/30"
                                                required
                                            />
                                            {errors.email && (
                                                <p className="text-xs font-medium text-danger">{errors.email}</p>
                                            )}
                                        </div>

                                        {/* Role Access Field */}
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-xs font-medium text-foreground">
                                                Role Access
                                            </Label>
                                            <Select
                                                value={data.role}
                                                onValueChange={(val) => setData('role', val as 'admin' | 'user')}
                                            >
                                                <SelectTrigger id="role" className="h-9 w-full border-border bg-background text-sm">
                                                    <SelectValue placeholder="Pilih Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">
                                                        <div className="flex items-center gap-2">
                                                            <IconUserShield className="size-3.5 text-primary" />
                                                            <span>Administrator — Akses Penuh Sistem</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="user">
                                                        <div className="flex items-center gap-2">
                                                            <IconUserCheck className="size-3.5 text-muted-foreground" />
                                                            <span>User — Akses Tim Standard</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.role && (
                                                <p className="text-xs font-medium text-danger">{errors.role}</p>
                                            )}
                                        </div>

                                        {/* Optional Password Reset */}
                                        <div className="space-y-2 pt-2 border-t border-border">
                                            <Label htmlFor="password" className="text-xs font-medium text-foreground">
                                                Password Baru <span className="font-normal text-muted-foreground">(Opsional)</span>
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Biarkan kosong jika tidak ingin mengubah password user"
                                                className="h-9 border-border bg-background text-sm focus-visible:ring-ring/30"
                                            />
                                            {errors.password && (
                                                <p className="text-xs font-medium text-danger">{errors.password}</p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="h-9 border-border text-xs font-medium hover:bg-muted"
                                            >
                                                <Link href="/users">Batal</Link>
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={processing}
                                                className="h-9 gap-1.5 bg-primary font-medium text-primary-foreground hover:bg-primary-hover shadow-xs"
                                            >
                                                <IconCheck className="size-4" />
                                                <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
