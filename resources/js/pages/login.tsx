import { Head } from '@inertiajs/react';

import { LoginForm } from '@/components/login-form';

export default function Page() {
    return (
        <>
            <Head title="Masuk" />
            <div className="flex min-h-svh w-full items-center justify-center bg-background-soft p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center justify-center gap-4">
                        <img
                            src="/images/Logo RAI Full.png"
                            alt="Rumah Atsiri Indonesia"
                            className="h-14 w-auto object-contain"
                        />
                        <div className="h-12 w-px bg-border" />
                        <div className="flex flex-col">
                            <h1 className="text-xl leading-tight font-bold tracking-tight">
                                Project Tracker
                            </h1>
                            <p className="text-sm leading-tight text-muted-foreground">
                                System Management
                            </p>
                        </div>
                    </div>
                    <LoginForm />
                </div>
            </div>
        </>
    );
}
