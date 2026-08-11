import { Head } from '@inertiajs/react';

import { AppSidebar } from '@/components/app-sidebar';
import { FeatureRequestForm } from '@/components/feature-requests/feature-request-form';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { formatAppDateTimeInput } from '@/lib/datetime';
import type { DeployedProject, FeatureRequest } from '@/types/feature-request';

interface Props {
    featureRequest: FeatureRequest;
    deployedProjects: DeployedProject[];
    priorities: string[];
    slaConfigs: Record<string, number>;
}

export default function Edit({
    featureRequest,
    deployedProjects,
    priorities,
    slaConfigs,
}: Props) {
    return (
        <>
            <Head title={`Edit ${featureRequest.title}`} />
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
                        mode="edit"
                        featureRequestId={featureRequest.id}
                        deployedProjects={deployedProjects}
                        priorities={priorities}
                        slaConfigs={slaConfigs}
                        initialData={{
                            project_id: String(featureRequest.project_id),
                            title: featureRequest.title,
                            description: featureRequest.description,
                            priority: featureRequest.priority,
                            requested_at: formatAppDateTimeInput(
                                featureRequest.requested_at,
                            ),
                        }}
                    />
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
