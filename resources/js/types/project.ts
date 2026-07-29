import type { User } from './auth';

export type ProjectStatusType =
    | 'planning'
    | 'in_progress'
    | 'on_hold'
    | 'completed_pending_deployment'
    | 'deployed_running'
    | 'deployed_maintenance';

export type BriefFeatureStatusType = 'todo' | 'in_progress' | 'done';

export interface BriefFeature {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    status: BriefFeatureStatusType;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: ProjectStatusType;
    start_date: string | null;
    target_end_date: string | null;
    actual_end_date: string | null;
    created_by: number;
    creator?: User;
    users?: User[];
    brief_features?: BriefFeature[];
    brief_features_count?: number;
    realization_percentage: number;
    created_at: string;
    updated_at: string;
}

export interface PaginatedProjects {
    data: Project[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface ProjectSummary {
    total_projects: number;
    in_progress_count: number;
    deployed_count: number;
    okr1_avg_realization: number;
}
