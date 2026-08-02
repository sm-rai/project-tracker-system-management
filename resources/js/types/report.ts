export type ReportPeriodType = 'weekly_default' | 'custom_range';

export interface ReportProjectOkrSummary {
    target: number;
    total_projects: number;
    evaluable_projects: number;
    achieved_projects: number;
    achievement_percentage: number | null;
}

export interface ReportOkrSummary {
    brief_realization: ReportProjectOkrSummary;
    issue_on_time: number;
    feature_request_on_time: number;
}

export interface ReportSummary {
    id: number;
    period_type: ReportPeriodType;
    period_label: string;
    generated_at: string;
    okr: ReportOkrSummary;
    href: string;
}

export interface ReportDefaultPeriod {
    start: string;
    end: string;
    label: string;
}

export interface ReportOkrMetric {
    key: 'issue_on_time' | 'feature_request_on_time';
    label: string;
    actual: number;
    target: number;
    achieved: boolean;
    total_items: number;
    on_time_items: number | null;
    empty_label: string | null;
}

export interface ReportProjectItem {
    id: number;
    name: string;
    status: string;
    status_label: string;
    is_active_development: boolean;
    brief_features_total: number;
    brief_features_done: number;
    realization_percentage: number | null;
    target_percentage: number;
    is_evaluable: boolean;
    achieved: boolean | null;
    empty_label: string | null;
}

export interface ReportCountItem {
    value: string;
    label?: string;
    count: number;
}

export interface ReportIssueItem {
    id: number;
    title: string;
    project_name: string;
    priority: 'urgent' | 'normal' | 'low';
    root_cause_category: 'system_error' | 'non_system' | 'other';
    status: 'open' | 'resolved';
    reported_at: string;
    due_date: string;
    resolved_at: string | null;
    is_on_time: boolean | null;
}

export interface ReportFeatureRequestItem {
    id: number;
    title: string;
    project_name: string;
    priority: 'urgent' | 'normal' | 'low';
    status: 'open' | 'in_progress' | 'fulfilled';
    requested_at: string;
    due_date: string;
    fulfilled_at: string | null;
    is_on_time: boolean | null;
}

export interface ReportProjectBreakdown {
    target_percentage: number;
    project_achievement_percentage: number | null;
    active_total: number;
    evaluable_total: number;
    achieved_total: number;
    total: number;
    projects: ReportProjectItem[];
    status_distribution: ReportCountItem[];
}

export interface ReportIssueBreakdown {
    okr_percentage: number;
    empty_label: string | null;
    total: number;
    on_time: number;
    open: number;
    resolved: number;
    items: ReportIssueItem[];
    by_status: ReportCountItem[];
    by_priority: ReportCountItem[];
    by_root_cause: ReportCountItem[];
}

export interface ReportFeatureRequestBreakdown {
    okr_percentage: number;
    empty_label: string | null;
    total: number;
    on_time: number;
    open: number;
    in_progress: number;
    fulfilled: number;
    items: ReportFeatureRequestItem[];
    by_status: ReportCountItem[];
    by_priority: ReportCountItem[];
}

export interface ReportDetail {
    id: number;
    period: {
        type: ReportPeriodType;
        start: string;
        end: string;
        label: string;
    };
    generated_at: string;
    okr: {
        brief_realization: ReportProjectOkrSummary & {
            key: 'brief_realization';
            label: string;
        };
        issue_on_time: ReportOkrMetric;
        feature_request_on_time: ReportOkrMetric;
    };
    breakdowns: {
        projects: ReportProjectBreakdown;
        issues: ReportIssueBreakdown;
        feature_requests: ReportFeatureRequestBreakdown;
    };
}
