import { Form, Head, usePage } from '@inertiajs/react';
import { CheckCircle2, KeyRound, UserRound } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { update } from '@/routes/user-password';
import type { ProfileUser } from '@/types/auth';

interface ProfilePageProps {
    user: ProfileUser;
}

interface SharedAuthProps {
    status?: string | null;
    [key: string]: unknown;
}

export default function ProfilePage({ user }: ProfilePageProps) {
    const { status } = usePage<SharedAuthProps>().props;
    const isPasswordUpdated = status === 'password-updated';

    return (
        <>
            <Head title="Profil Saya" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader title="Profil Saya" />
                    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-md bg-primary-surface text-primary">
                                            <UserRound className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle>
                                                Identitas Saya
                                            </CardTitle>
                                            <CardDescription>
                                                Informasi akun yang terdaftar di
                                                Project Tracker.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="profile-name">
                                                Nama
                                            </FieldLabel>
                                            <Input
                                                id="profile-name"
                                                value={user.name}
                                                readOnly
                                                aria-readonly="true"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="profile-email">
                                                Email
                                            </FieldLabel>
                                            <Input
                                                id="profile-email"
                                                type="email"
                                                value={user.email}
                                                readOnly
                                                aria-readonly="true"
                                            />
                                        </Field>
                                    </FieldGroup>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-md bg-info-surface text-info">
                                            <KeyRound className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle>Ubah Password</CardTitle>
                                            <CardDescription>
                                                Gunakan password saat ini untuk
                                                membuat password baru.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        {...update.form()}
                                        errorBag="updatePassword"
                                        resetOnSuccess
                                    >
                                        {({ errors, processing }) => (
                                            <FieldGroup>
                                                {isPasswordUpdated && (
                                                    <p
                                                        role="status"
                                                        aria-live="polite"
                                                        className="flex items-center gap-2 rounded-md border border-success/20 bg-success-surface px-3 py-2 text-success text-small"
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                        Password berhasil
                                                        diperbarui.
                                                    </p>
                                                )}
                                                <Field
                                                    data-invalid={
                                                        !!errors.current_password
                                                    }
                                                >
                                                    <FieldLabel htmlFor="current_password">
                                                        Password saat ini
                                                    </FieldLabel>
                                                    <Input
                                                        id="current_password"
                                                        name="current_password"
                                                        type="password"
                                                        autoComplete="current-password"
                                                        required
                                                        aria-invalid={
                                                            !!errors.current_password
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={[
                                                            {
                                                                message:
                                                                    errors.current_password,
                                                            },
                                                        ]}
                                                    />
                                                </Field>
                                                <Field
                                                    data-invalid={
                                                        !!errors.password
                                                    }
                                                >
                                                    <FieldLabel htmlFor="password">
                                                        Password baru
                                                    </FieldLabel>
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        autoComplete="new-password"
                                                        required
                                                        aria-invalid={
                                                            !!errors.password
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={[
                                                            {
                                                                message:
                                                                    errors.password,
                                                            },
                                                        ]}
                                                    />
                                                </Field>
                                                <Field
                                                    data-invalid={
                                                        !!errors.password_confirmation
                                                    }
                                                >
                                                    <FieldLabel htmlFor="password_confirmation">
                                                        Konfirmasi password baru
                                                    </FieldLabel>
                                                    <Input
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        type="password"
                                                        autoComplete="new-password"
                                                        required
                                                        aria-invalid={
                                                            !!errors.password_confirmation
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={[
                                                            {
                                                                message:
                                                                    errors.password_confirmation,
                                                            },
                                                        ]}
                                                    />
                                                </Field>
                                                <Button
                                                    type="submit"
                                                    className="w-full sm:w-fit"
                                                    disabled={processing}
                                                >
                                                    {processing
                                                        ? 'Menyimpan password...'
                                                        : 'Simpan Password Baru'}
                                                </Button>
                                            </FieldGroup>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
