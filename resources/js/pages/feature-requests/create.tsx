import { Head } from '@inertiajs/react';

import { AppSidebar } from '@/components/app-sidebar';
import { FeatureRequestForm } from '@/components/feature-requests/feature-request-form';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { DeployedProject } from '@/types/feature-request';

interface Props {
    deployedProjects: DeployedProject[];
    priorities: string[];
    slaConfigs: Record<string, number>;
    initialProjectId: number | null;
}

function localDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    return now.toISOString().slice(0, 16);
}

export default function Create({
    deployedProjects,
    priorities,
    slaConfigs,
    initialProjectId,
}: Props) {
    return (
        <>
            <Head title="Catat Feature Request" />
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
                    <SiteHeader title="Feature Request" />
                    <FeatureRequestForm
                        mode="create"
                        deployedProjects={deployedProjects}
                        priorities={priorities}
                        slaConfigs={slaConfigs}
                        initialData={{
                            project_id: initialProjectId
                                ? String(initialProjectId)
                                : '',
                            title: '',
                            description: '',
                            priority: 'normal',
                            requested_at: localDateTime(),
                        }}
                    />
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
