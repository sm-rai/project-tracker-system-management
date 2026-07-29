import { Head, usePage } from '@inertiajs/react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { User } from '@/types/auth';

export default function Page() {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth?.user;

    return (
        <>
            <Head title="Dashboard" />
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
                    <SiteHeader title="Dashboard" />
                    <div className="flex flex-1 flex-col p-4 md:p-6">
                        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-xs">
                            <h2 className="text-xl font-semibold tracking-tight">
                                Selamat Datang, {user?.name || 'User'}!
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Project Tracker System Management — IT Rumah
                                Atsiri Indonesia.
                            </p>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
