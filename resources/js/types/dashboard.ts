export interface DashboardPeriod {
    start: string;
    end: string;
    label: string;
    generated_at: string;
}

export interface DashboardOkrMetric {
    key: 'issue_on_time' | 'feature_request_on_time';
    label: string;
    actual: number;
    target: number;
    delta: number;
    achieved: boolean;
    total_items: number;
    on_time_items: number | null;
    empty_label: string | null;
}

export interface DashboardProjectOkrProject {
    id: number;
    name: string;
    status: DashboardProjectStatusDistribution['value'];
    status_label: string;
    brief_features_total: number;
    brief_features_done: number;
    realization_percentage: number | null;
    target_percentage: number;
    is_evaluable: boolean;
    achieved: boolean | null;
    empty_label: string | null;
}

export interface DashboardProjectOkrMetric {
    key: 'brief_realization';
    label: string;
    target: number;
    total_projects: number;
    evaluable_projects: number;
    achieved_projects: number;
    projects: DashboardProjectOkrProject[];
    empty_label: string | null;
}

export interface DashboardOperational {
    total_projects: number;
    deployed_maintenance: number;
    open_issues: number;
    overdue_issues: number;
    open_feature_requests: number;
    overdue_feature_requests: number;
}

export interface DashboardProjectStatusDistribution {
    value:
        | 'planning'
        | 'in_progress'
        | 'on_hold'
        | 'completed_pending_deployment'
        | 'deployed_running'
        | 'deployed_maintenance';
    label: string;
    count: number;
}

export interface DashboardAttentionItem {
    id: number;
    title: string;
    project_name: string;
    priority: 'urgent' | 'normal' | 'low';
    status: string;
    due_date: string;
    days_overdue: number;
    href: string;
}

export interface DashboardData {
    period: DashboardPeriod;
    okr: {
        brief_realization: DashboardProjectOkrMetric;
        issue_on_time: DashboardOkrMetric;
        feature_request_on_time: DashboardOkrMetric;
    };
    operational: DashboardOperational;
    projectStatusDistribution: DashboardProjectStatusDistribution[];
    attention: {
        issues: DashboardAttentionItem[];
        feature_requests: DashboardAttentionItem[];
    };
}
