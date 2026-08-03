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
import { redirect as googleRedirect } from '@/routes/auth/google';
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
                    <div className="my-4 flex items-center gap-3 text-muted-foreground text-small">
                        <div className="h-px flex-1 bg-border" />
                        <span>atau</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <a href={googleRedirect.url()}>
                            <svg
                                aria-hidden="true"
                                className="size-4"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.85-1.7 2.9-4.2 2.9-7.42Z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 21c2.43 0 4.47-.8 5.96-2.17l-3.15-2.45c-.83.56-1.89.9-2.81.9-2.43 0-4.49-1.64-5.23-3.84H3.52v2.52A9 9 0 0 0 12 21Z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M6.77 13.44A5.4 5.4 0 0 1 6.5 12c0-.5.1-.98.27-1.44V8.04H3.52A9 9 0 0 0 3 12c0 1.43.34 2.78.95 3.96l2.82-2.52Z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 6.72c1.32 0 2.5.45 3.43 1.34L18 5.49C16.46 4.02 14.43 3 12 3a9 9 0 0 0-8.48 5.04l2.82 2.52c1.17-2.2 3.23-3.84 5.66-3.84Z"
                                />
                            </svg>
                            <span>Masuk dengan Google</span>
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
