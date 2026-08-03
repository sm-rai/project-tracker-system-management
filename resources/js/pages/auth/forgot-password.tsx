import { Form, Head, Link, usePage } from '@inertiajs/react';

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
import { email } from '@/routes/password';

interface ForgotPasswordPageProps {
    status?: string | null;
    [key: string]: unknown;
}

export default function ForgotPassword() {
    const { status } = usePage<ForgotPasswordPageProps>().props;

    return (
        <>
            <Head title="Lupa Password" />
            <AuthPageLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h3">
                            Atur ulang password
                        </CardTitle>
                        <CardDescription className="text-small">
                            Masukkan email akun Anda. Kami akan mengirimkan
                            tautan untuk membuat password baru.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...email.form()} resetOnSuccess>
                            {({ errors, processing }) => (
                                <FieldGroup>
                                    {status && (
                                        <p
                                            role="status"
                                            aria-live="polite"
                                            className="rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-small"
                                        >
                                            {status ===
                                            'We have emailed your password reset link.'
                                                ? 'Tautan untuk mengatur ulang password telah dikirim. Periksa inbox email Anda.'
                                                : status}
                                        </p>
                                    )}
                                    <Field data-invalid={!!errors.email}>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="nama@rumahatsiri.com"
                                            autoComplete="email"
                                            autoFocus
                                            required
                                            aria-invalid={!!errors.email}
                                        />
                                        <FieldError
                                            errors={[{ message: errors.email }]}
                                        />
                                    </Field>
                                    <Field>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Mengirim tautan…'
                                                : 'Kirim Tautan Reset'}
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
