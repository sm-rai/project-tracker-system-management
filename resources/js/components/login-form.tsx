import { Form } from '@inertiajs/react';

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

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-h3">
                        Masuk ke akun Anda
                    </CardTitle>
                    <CardDescription className="text-small">
                        Masukkan email dan password untuk mengakses Project
                        Tracker
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...store.form()} resetOnError>
                        {({ errors, processing }) => (
                            <FieldGroup>
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
                                    <FieldLabel htmlFor="password">
                                        Password
                                    </FieldLabel>
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
                                        {processing
                                            ? 'Sedang masuk...'
                                            : 'Masuk'}
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
