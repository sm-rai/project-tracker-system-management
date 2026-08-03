import { Form, Head, Link } from '@inertiajs/react';

import { create as login } from '@/actions/Laravel/Fortify/Http/Controllers/AuthenticatedSessionController';
import { AuthPageLayout } from '@/components/auth/auth-page-layout';
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
import { update } from '@/routes/password';

interface ResetPasswordPageProps {
    email: string;
    token: string;
}

export default function ResetPassword({
    email,
    token,
}: ResetPasswordPageProps) {
    return (
        <>
            <Head title="Buat Password Baru" />
            <AuthPageLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h3">
                            Buat password baru
                        </CardTitle>
                        <CardDescription className="text-small">
                            Buat password baru untuk kembali mengakses Project
                            Tracker.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...update.form()}>
                            {({ errors, processing }) => (
                                <FieldGroup>
                                    <Input
                                        name="token"
                                        type="hidden"
                                        value={token}
                                        readOnly
                                    />
                                    <Field data-invalid={!!errors.email}>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            autoComplete="email"
                                            readOnly
                                            required
                                            aria-invalid={!!errors.email}
                                        />
                                        <FieldError
                                            errors={[{ message: errors.email }]}
                                        />
                                    </Field>
                                    <Field data-invalid={!!errors.password}>
                                        <FieldLabel htmlFor="password">
                                            Password baru
                                        </FieldLabel>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            autoFocus
                                            required
                                            aria-invalid={!!errors.password}
                                        />
                                        <FieldError
                                            errors={[
                                                { message: errors.password },
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
                                    <Field>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Menyimpan password…'
                                                : 'Simpan Password Baru'}
                                        </Button>
                                    </Field>
                                    <Link
                                        href={login.url()}
                                        className="w-fit text-primary underline-offset-4 text-small hover:underline"
                                    >
                                        Kembali ke halaman masuk
                                    </Link>
                                </FieldGroup>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </AuthPageLayout>
        </>
    );
}
