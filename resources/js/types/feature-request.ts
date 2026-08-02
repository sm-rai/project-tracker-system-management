export interface DeployedProject {
    id: number;
    name: string;
    status: string;
}

export interface FeatureRequest {
    id: number;
    project_id: number;
    title: string;
    description: string;
    priority: string;
    requested_at: string;
    due_date: string;
    fulfilled_at: string | null;
    fulfillment_note: string | null;
    status: 'open' | 'in_progress' | 'fulfilled';
    is_on_time: boolean | null;
    project: DeployedProject;
}

export interface PaginatedFeatureRequests {
    data: FeatureRequest[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}
