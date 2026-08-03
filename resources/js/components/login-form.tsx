import { Form, Link, usePage } from '@inertiajs/react';

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
import { cn } from '@/lib/utils';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { status } = usePage<{ status?: string | null }>().props;

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-h3">
                        Masuk ke akun Anda
                    </CardTitle>
                    <CardDescription className="text-small">
                        Masukkan email dan password untuk mengakses Project
                        Tracker.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...store.form()} resetOnError>
                        {({ errors, processing }) => (
                            <FieldGroup>
                                {status && (
                                    <p
                                        role="status"
                                        aria-live="polite"
                                        className="rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-small"
                                    >
                                        {status === 'Password has been reset.'
                                            ? 'Password berhasil diperbarui. Silakan masuk dengan password baru Anda.'
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
                                        autoComplete="username"
                                        autoFocus
                                        required
                                        aria-invalid={!!errors.email}
                                    />
                                    <FieldError
                                        errors={[{ message: errors.email }]}
                                    />
                                </Field>
                                <Field data-invalid={!!errors.password}>
                                    <div className="flex items-center justify-between gap-3">
                                        <FieldLabel htmlFor="password">
                                            Password
                                        </FieldLabel>
                                        <Link
                                            href={request.url()}
                                            className="text-primary underline-offset-4 text-small hover:underline"
                                        >
                                            Lupa Password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        aria-invalid={!!errors.password}
                                    />
                                    <FieldError
                                        errors={[{ message: errors.password }]}
                                    />
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Sedang masuk…' : 'Masuk'}
                                    </Button>
                                </Field>
                            </FieldGroup>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
