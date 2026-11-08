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

interface ReportSummaryBase {
    id: number;
    period_type: ReportPeriodType;
    period_label: string;
    generated_at: string;
    href: string;
}

export interface ReportLegacySummary extends ReportSummaryBase {
    format_version: 1;
    okr: ReportOkrSummary;
}

export interface ReportActivitySummary {
    total_activities: number;
    unique_items: number;
    groups: {
        entity_type: ReportActivity['entity_type'];
        label: string;
        new_items: number;
        completed_items: number;
        total_activities: number;
        unique_items: number;
    }[];
}

export interface ReportActivitySummaryItem extends ReportSummaryBase {
    format_version: 2;
    activity_summary: ReportActivitySummary;
}

export interface ReportSimplifiedSummaryItem extends ReportSummaryBase {
    format_version: 3;
    summary: {
        active_project_count: number;
        resolved_issue_count: number;
        fulfilled_feature_request_count: number;
    };
}

export type ReportSummary =
    | ReportLegacySummary
    | ReportActivitySummaryItem
    | ReportSimplifiedSummaryItem;

export interface ReportActivity {
    entity_type: 'project' | 'brief_feature' | 'issue' | 'feature_request';
    entity_id: number;
    title: string;
    project_id: number | null;
    project_name: string | null;
    activity_type: 'created' | 'completed';
    activity_label: string;
    occurred_at: string;
    status: string;
    status_label: string;
    priority: string | null;
    due_date: string | null;
    note: string | null;
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

interface ReportDetailBase {
    id: number;
    period: {
        type: ReportPeriodType;
        start: string;
        end: string;
        label: string;
    };
    generated_at: string;
}

export interface ReportActivityDetail extends ReportDetailBase {
    format_version: 2;
    activity_summary: ReportActivitySummary;
    activities: ReportActivity[];
}

export interface ReportSimplifiedProject {
    id: number;
    name: string;
    brief_features_done: number;
    brief_features_total: number;
    progress_percentage: number | null;
}

export interface ReportResolvedItem {
    id: number;
    title: string;
    description: string;
    project_name: string | null;
    solved_at: string;
}

export interface ReportSimplifiedDetail extends ReportDetailBase {
    format_version: 3;
    summary: {
        active_project_count: number;
        resolved_issue_count: number;
        fulfilled_feature_request_count: number;
    };
    active_projects: ReportSimplifiedProject[];
    resolved_issues: ReportResolvedItem[];
    fulfilled_feature_requests: ReportResolvedItem[];
}

export type ReportDetail =
    ReportLegacyDetail | ReportActivityDetail | ReportSimplifiedDetail;

export interface ReportLegacyDetail extends ReportDetailBase {
    format_version: 1;
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
