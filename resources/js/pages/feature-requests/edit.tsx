import { Head } from '@inertiajs/react';

import { AppSidebar } from '@/components/app-sidebar';
import { FeatureRequestForm } from '@/components/feature-requests/feature-request-form';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { DeployedProject, FeatureRequest } from '@/types/feature-request';

interface Props {
    featureRequest: FeatureRequest;
    deployedProjects: DeployedProject[];
    priorities: string[];
    slaConfigs: Record<string, number>;
}

function inputDateTime(value: string) {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
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
            <SidebarProvider>
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
                            requested_at: inputDateTime(
                                featureRequest.requested_at,
                            ),
                        }}
                    />
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
