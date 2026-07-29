---
name: Project Tracker — Rumah Atsiri Indonesia
description: Internal System Management & OKR Tracker Design System
colors:
  primary: "#AF4424"
  primary-hover: "#8C361D"
  primary-surface: "#F3E3DE"
  foreground: "#25211E"
  muted-foreground: "#756E66"
  border: "#E7DFD5"
  muted: "#EEEAE4"
  background-soft: "#FAF7F2"
  card: "#FFFFFF"
  success: "#3F7A4A"
  success-surface: "#E5F0E5"
  warning: "#B9772E"
  warning-surface: "#F6E8D6"
  pending: "#9C842F"
  pending-surface: "#F2EACF"
  info: "#2F7C7A"
  info-surface: "#DCEDEC"
  danger: "#DC2626"
  danger-surface: "#FEE2E2"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2rem)"
    fontWeight: 600
    lineHeight: "1.3"
  headline:
    fontFamily: "Plus Jakarta Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: "1.35"
  title:
    fontFamily: "Plus Jakarta Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: "1.4"
  body:
    fontFamily: "Plus Jakarta Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.6"
  label:
    fontFamily: "Plus Jakarta Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1.4"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-approve:
    backgroundColor: "{colors.success}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Design System: Project Tracker — Rumah Atsiri Indonesia

## Overview

**Creative North Star: "The Botanical Wellness Sanctuary"**

The Project Tracker design system draws its visual authority from the authentic architectural and brand heritage of Rumah Atsiri Indonesia. It synthesizes earthy terracotta clay tones (`#AF4424`), botanical foliage greens (`#3F7A4A`), warm stone surfaces (`#FAF7F2`), and eucalyptus teals (`#2F7C7A`) into a calm, highly functional executive interface for internal division management.

Unlike noisy corporate dashboards filled with harsh traffic-light colors, this interface prioritizes high legibility, calm focus, and executive presentation readiness. Data presentation feels natural and grounded, enabling fast administrative entry while maintaining publication-grade aesthetic standards for Head of Department (HoD) reporting.

**Key Characteristics:**
- **Terracotta Primary Core:** Terracotta clay drives primary actions and active navigation without dominating the view.
- **Botanical Earth Semantic Tones:** Earthy, subdued status indicators replacing generic saturated alert colors.
- **Warm Stone Neutral Surface:** Page backgrounds and cards leverage warm stone and architectural concrete tones rather than cold stark grays.
- **Unified Typographic Voice:** Single font family (**Plus Jakarta Sans**) applied systematically across headings, body text, and tabular financial/metric data.

---

## Colors

The color system is organized into a primary brand palette, botanical semantic statuses, paired surface containers, and warm neutral background layers.

### Primary
- **Terracotta Clay** (`#AF4424`): Primary brand color used for main calls-to-action, active navigation items, progress indicators, and active control focus rings.
- **Terracotta Deep Hover** (`#8C361D`): Hover and pressed state for primary controls.
- **Terracotta Surface** (`#F3E3DE`): Soft primary highlight background for active subtle navigation items and selected cards.

### Secondary & Semantic
- **Botanical Success Green** (`#3F7A4A`): Approved states, completed milestones, and positive OKR achievements. Paired with **Success Surface** (`#E5F0E5`).
- **Amber Warning** (`#B9772E`): Revision requests and items requiring operational attention. Paired with **Warning Surface** (`#F6E8D6`).
- **Warm Clay Pending** (`#9C842F`): In-progress stages and items awaiting supervisory review. Paired with **Pending Surface** (`#F2EACF`).
- **Eucalyptus Teal Info** (`#2F7C7A`): Neutral system notes, information callouts, and secondary indicators. Paired with **Info Surface** (`#DCEDEC`).
- **Rust Danger** (`#DC2626`): Destructive actions, rejected statuses, and critical SLA breaches. Paired with **Danger Surface** (`#FEE2E2`).

### Neutral
- **Charcoal Text** (`#25211E`): Primary headings, body copy, and high-contrast icon elements.
- **Stone Muted Text** (`#756E66`): Secondary metadata, timestamps, helper text, and inactive tab labels.
- **Warm Stone Border** (`#E7DFD5`): Card outlines, table dividers, and form input borders.
- **Neutral Surface** (`#EEEAE4`): Disabled control backgrounds, neutral chips, and empty state containers.
- **Page Soft Background** (`#FAF7F2`): Soft warm background for the app shell and page layout.
- **Card Surface** (`#FFFFFF`): Primary container, form body, and modal background.

### Named Rules
**The Terracotta Priority Rule.** Primary terracotta accent (`#AF4424`) is reserved strictly for primary brand actions, key progress bars, and active navigation. It must cover $\le 10\%$ of any viewport to preserve visual hierarchy.

**The Semantic Surface Pairing Rule.** Status badges and inline callouts must always pair a solid semantic text color with its corresponding semantic surface background (e.g., `#3F7A4A` text on `#E5F0E5` background). Never use raw solid colors for badge fills.

---

## Typography

**Display & Body Font:** Plus Jakarta Sans (loaded from Google Fonts with weights 400, 500, 600 and `display=swap`).
**Fallback Stack:** `"Plus Jakarta Sans", -apple-system, "Segoe UI", sans-serif`.

### Hierarchy
- **Display / H1** (Semibold 600, 28–32px / `1.75rem–2rem`, line-height `1.3`): Main page titles and executive summary headers.
- **Headline / H2** (Semibold 600, 22–24px / `1.375rem–1.5rem`, line-height `1.35`): Section headers, report card titles, and dashboard widget titles.
- **Title / H3** (Medium 500, 18px / `1.125rem`, line-height `1.4`): Subsection titles, table group headers, and modal titles.
- **Body / Regular** (Regular 400, 15–16px / `1rem`, line-height `1.6`): Primary copy, table cell content, and form input values.
- **Body / Small** (Regular 400, 13px / `0.8125rem`, line-height `1.5`): Helper text, timestamps, user metadata, and secondary notes.
- **Caption / Badge** (Medium 500, 12px / `0.75rem`, line-height `1.4`): Status badge labels, category tags, and table header column names.
- **Data / Tabular** (Regular/Medium 400/500, 13–16px with `font-variant-numeric: tabular-nums`): OKR percentage metrics, SLA counts, and financial/statistical figures.

### Named Rules
**The Tabular Alignment Rule.** All numerical metrics, percentages, SLA day counts, and table figures must use `tabular-nums` (`font-variant-numeric: tabular-nums`) to ensure immaculate column alignment in data tables and report summaries.

---

## Layout

The application employs a desktop-first, high-density layout architecture optimized for $1280\text{px}+$ screen widths.

- **App Shell:** Fixed left sidebar navigation (`250px` width) or responsive top bar with a flexible content canvas.
- **Container Max-Width:** Content canvas bounded at `1280px` (`max-w-7xl`) for optimal scanning line lengths.
- **Grid Rhythm:** 12-column flex/grid system with standard `16px` (`gap-4`) or `24px` (`gap-6`) gutters.
- **Spacing Scale:** Standard 4px-base scale (`4px`, `8px`, `16px`, `24px`, `32px`, `48px`).

---

## Elevation & Depth

The design system uses a flat-by-default, warm tonal layering strategy rather than heavy drop shadows.

- **Depth via Contrast:** Depth is created by placing crisp `#FFFFFF` cards against the `#FAF7F2` soft page background, defined by subtle `#E7DFD5` borders.
- **Shadow Vocabulary:**
  - **Resting Containers:** `box-shadow: none` or `0 1px 2px 0 rgba(37, 33, 30, 0.03)`.
  - **Dropdown & Modals:** `box-shadow: 0 4px 16px -2px rgba(37, 33, 30, 0.08), 0 2px 4px -1px rgba(37, 33, 30, 0.04)`.

### Named Rules
**The Flat Warm Surface Rule.** Avoid multi-layered ambient drop shadows. Separate containers using background color contrast (`#FFFFFF` on `#FAF7F2`) and explicit 1px borders (`#E7DFD5`).

---

## Shapes

- **Base Radius:** `8px` (`rounded-md`) for cards, form inputs, dialogs, and primary buttons.
- **Small Radius:** `6px` (`rounded-sm`) for inner controls, select options, and code blocks.
- **Large Radius:** `12px` (`rounded-lg`) for major container panels and dashboard widgets.
- **Pill Radius:** `9999px` (`rounded-full`) reserved exclusively for status badges and tag chips.

---

## Components

### Buttons
- **Shape:** `8px` corner radius (`rounded-md`).
- **Primary:** Background `#AF4424`, Text `#FFFFFF`, Hover `#8C361D`, Padding `10px 20px`.
- **Secondary:** Background `#FFFFFF`, Text `#25211E`, Border `#E7DFD5`, Hover `#FAF7F2`.
- **Approve / Success:** Background `#3F7A4A`, Text `#FFFFFF`, Hover darker by 10%.
- **Danger / Destructive:** Background `#DC2626`, Text `#FFFFFF`, Hover darker by 10%.

### Status Badges
- **Shape:** Pill `9999px` (`rounded-full`).
- **Typography:** `text-caption` (Plus Jakarta Sans Medium 500, 12px).
- **Structure:** Surface background + solid text + 1px border at 30% opacity of solid text color.
- **Examples:**
  - `deployed_running` / `approved`: `#E5F0E5` bg, `#3F7A4A` text.
  - `in_progress` / `pending`: `#F2EACF` bg, `#9C842F` text.
  - `on_hold` / `warning`: `#F6E8D6` bg, `#B9772E` text.
  - `deployed_maintenance` / `info`: `#DCEDEC` bg, `#2F7C7A` text.
  - `rejected` / `overdue`: `#FEE2E2` bg, `#DC2626` text.

### Cards / Containers
- **Background:** `#FFFFFF` card surface.
- **Border:** 1px solid `#E7DFD5`.
- **Corner Radius:** `8px` or `12px`.
- **Padding:** `20px` or `24px`.

### Inputs / Forms
- **Input Background:** `#FFFFFF`.
- **Input Border:** 1px solid `#E7DFD5`.
- **Focus Ring:** `2px` focus ring with `#AF4424` at 30% opacity.
- **Typography:** Input text `text-body` (`#25211E`), Helper/Error text `text-small`.

---

## Do's and Don'ts

### Do:
- **Do** use `Plus Jakarta Sans` exclusively for all UI typography, headers, and data displays across the application.
- **Do** pair semantic surface backgrounds with matching solid text colors for all status badges and callouts.
- **Do** apply `tabular-nums` to numbers, metrics, and percentages in tables and executive report snapshots.
- **Do** maintain high contrast between text (`#25211E`) and background surfaces (`#FFFFFF` or `#FAF7F2`).

### Don't:
- **Don't** use raw Tailwind generic colors (e.g. `bg-emerald-500` or `text-blue-600`); always use configured design tokens (`--primary`, `--success`, `--warning`, etc.).
- **Don't** use bright neon traffic-light colors for statuses; stick to the botanical earth palette (`#3F7A4A`, `#B9772E`, `#9C842F`, `#2F7C7A`, `#DC2626`).
- **Don't** use heavy drop shadows on resting card containers.
- **Don't** rely on color alone to convey status; always include clear textual labels or icons alongside color indicators.
