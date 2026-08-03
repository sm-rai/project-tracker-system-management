import { Head } from '@inertiajs/react';

import { AuthPageLayout } from '@/components/auth/auth-page-layout';
import { LoginForm } from '@/components/login-form';

export default function Page() {
    return (
        <>
            <Head title="Masuk" />
            <AuthPageLayout>
                <LoginForm />
            </AuthPageLayout>
        </>
    );
}
