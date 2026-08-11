import { Head } from '@inertiajs/react';

import { AppSidebar } from '@/components/app-sidebar';
import { IssueForm } from '@/components/issues/issue-form';
import type { IssueFormData } from '@/components/issues/issue-form';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { formatAppDateTimeInput } from '@/lib/datetime';

interface Project {
    id: number;
    name: string;
    status: string;
}

interface IssueCreateProps {
    deployedProjects: Project[];
    priorities: string[];
    rootCauses: string[];
    slaConfigs: Record<string, number>;
}

export default function IssueCreatePage({
    deployedProjects,
    priorities,
    rootCauses,
    slaConfigs,
}: IssueCreateProps) {
    const initialData: IssueFormData = {
        project_id: '',
        title: '',
        description: '',
        priority: 'normal',
        root_cause_category: '',
        reported_at: formatAppDateTimeInput(),
    };

    return (
        <>
            <Head title="Catat Issue" />
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
                    <SiteHeader title="Issue" />
                    <IssueForm
                        mode="create"
                        action="/issues"
                        initialData={initialData}
                        deployedProjects={deployedProjects}
                        priorities={priorities}
                        rootCauses={rootCauses}
                        slaConfigs={slaConfigs}
                    />
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
