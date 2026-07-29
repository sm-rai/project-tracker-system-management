import { Head } from '@inertiajs/react';

import { AppSidebar } from '@/components/app-sidebar';
import { IssueForm } from '@/components/issues/issue-form';
import type { IssueFormData } from '@/components/issues/issue-form';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface Project {
    id: number;
    name: string;
    status: string;
}

interface Issue {
    id: number;
    project_id: number | null;
    title: string;
    description: string;
    priority: string;
    root_cause_category: string;
    reported_at: string;
}

interface IssueEditProps {
    issue: Issue;
    deployedProjects: Project[];
    priorities: string[];
    rootCauses: string[];
    slaConfigs: Record<string, number>;
}

function formatToLocalIso(isoString: string): string {
    if (!isoString) {
        return '';
    }

    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
}

export default function IssueEditPage({
    issue,
    deployedProjects,
    priorities,
    rootCauses,
    slaConfigs,
}: IssueEditProps) {
    const initialData: IssueFormData = {
        project_id: issue.project_id ? issue.project_id.toString() : '',
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        root_cause_category: issue.root_cause_category,
        reported_at: formatToLocalIso(issue.reported_at),
    };

    return (
        <>
            <Head title={`Edit Issue #${issue.id}`} />
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
                        mode="edit"
                        action={`/issues/${issue.id}`}
                        issueId={issue.id}
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
