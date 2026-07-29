# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Admin / PIC System Management (Erwin - IT Rumah Atsiri Indonesia)**: Sole primary user for MVP. Inputs and manages all system projects, brief features, operational issues, and feature requests. Generates and exports weekly OKR reports (PDF & PNG) for Head of Department (HoD) review. Architecture is extensible for multi-user/roles in future phases.

## Product Purpose

Project Tracker is an internal single source of truth web application for the System Management division at IT Rumah Atsiri Indonesia. It tracks new system development projects and business-as-usual operational issues/feature requests, automatically calculating division OKR metrics (OKR 1 & OKR 2) and generating weekly executive reports (PDF/PNG).

Success means eliminating manual weekly calculation errors, maintaining historical trends, and enabling instant 1-click report exports for leadership.

## Positioning

Unlike generic task trackers or Jira, Project Tracker directly couples project development lifecycles with running system operational support into a single unified entity structure, directly mapping every item to specific OKR target calculations (OKR 1: 75% brief feature realization; OKR 2: 80% issues & 90% feature requests resolved within SLA timeline).

## Operating Context

- **Environment**: Desktop web browser (internal division tool hosted via Coolify/VPS).
- **Workflows**: Daily project & issue management; weekly report generation (Senin–Minggu default) exported as full PDF reports and per-chart PNG snapshots for quick distribution via messaging (WhatsApp) or slides.
- **SLA Calculation**: Standard calendar days (including weekends) based on urgency priority levels (`urgent`=1d, `normal`=3d, `low`=7d).

## Capabilities and Constraints

- **Unified Entity Model**: Single `projects` entity seamlessly transitioning across lifecycle statuses (`planning`, `in_progress`, `on_hold`, `completed_pending_deployment`, `deployed_running`, `deployed_maintenance`).
- **OKR 1 Target**: Rata-rata % realisasi brief features on active/in-development projects (`planning`, `in_progress`, `on_hold`, `completed_pending_deployment`). Deployed projects count as 100% completed and exit the active OKR 1 radar while becoming eligible for OKR 2 tracking.
- **OKR 2 Target**: % on-time resolution for Issues and Feature Requests tied strictly to deployed systems (`deployed_running` / `deployed_maintenance`). Auto-defaults to 100% when no items exist in a period.
- **Tech Stack**: Laravel 13, Inertia.js (React 19), Tailwind CSS v4, shadcn/ui (Radix UI + Tailwind), MySQL.
- **Export Capabilities**: PDF generation via Spatie Browsershot (headless Chrome) and client/server-side PNG chart snapshots, saved permanently in immutable `report_snapshots`.

## Brand Commitments

- **Organization**: IT Rumah Atsiri Indonesia (Divisi System Management).
- **Design System**: Built on top of `shadcn/ui` components (Radix UI primitives + Tailwind CSS v4). Clean, professional executive dashboard aesthetic suitable for HoD presentations.

## Evidence on Hand

- **Product Requirements Document**: [docs/PRD.md](file:///e:/RAI-THINGS/project-tracker-system-management/docs/PRD.md) (v1.2).
- **Role & Access Plan**: `docs/PLAN_ROLE_ACCESS_CORE_MODEL.md`.

## Product Principles

1. **Single Source of Truth**: Unified lifecycle where a project automatically becomes an operational system post-deployment without duplicate data entry.
2. **Automated OKR Traceability**: Every status update directly drives real-time OKR metric calculations and trend histories.
3. **Executive Presentation Readiness**: All visual outputs (dashboards, charts, reports) must be high-density, clear, and publication-ready for leadership.
4. **Frictionless Administrative Flow**: Optimized for fast desktop logging and one-click snapshot generation.

## Accessibility & Inclusion

- Desktop browser focus (optimized for 1280px+ viewports).
- High contrast readable charts and accessible form controls via shadcn/ui.
