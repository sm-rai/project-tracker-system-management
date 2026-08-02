# Rumah Atsiri Color & Typography Design System

Dokumen ini adalah source of truth untuk color & typography design system pada
Project Tracker System Management yang sedang dikembangkan. Figma dan
implementasi frontend harus mengikuti token, pairing, dan mapping yang
didefinisikan di sini.

> **Update:** dokumen ini sekarang mencakup Typography (sebelumnya hanya
> Color), karena Figma Variables/Text Styles butuh keduanya sebagai satu
> collection yang konsisten. Untuk filosofi dan guardrail desain yang lebih
> luas (layout, komponen, motion, microcopy), lihat
> `ATSIRI_ONE_Design_System_Direction.md`.

## Brand Direction

Color direction ini mengambil karakter visual Rumah Atsiri Indonesia:

- Terracotta dari logo dan aksen brand.
- Botanical green dari aromatic garden, essential oils, dan sustainability.
- Warm stone, concrete, wood, dan neutral white dari arsitektur kawasan.
- Amber bottle, clay, dan earthy material dari produk essential oil.
- Calm wellness tone, bukan warna status generik yang terlalu "traffic light".

Public brand references:

- Website: https://www.rumahatsiri.com/
- Architecture: https://www.rumahatsiri.com/about/architecture
- Shop: https://shop.rumahatsiri.com/collections/all
- Instagram: https://www.instagram.com/rumahatsiri/
- LinkedIn: https://www.linkedin.com/company/rumahatsiriindonesia

## Naming Convention

Gunakan naming ini di Figma Variables atau Color Styles:

```text
Color/Brand/Primary
Color/Brand/Primary Hover
Color/Semantic/Success
Color/Semantic/Success Surface
Color/Neutral/Text
Color/Neutral/Border
```

Untuk implementasi CSS/Tailwind, naming bisa diturunkan menjadi:

```text
--primary
--primary-hover
--success
--success-foreground
--success-surface
--warning
--warning-surface
```

Untuk Typography (Text Styles di Figma), gunakan naming paralel:

```text
Type/Display/H1
Type/Heading/H2
Type/Heading/H3
Type/Body/Regular
Type/Body/Small
Type/Caption
Type/Data/Tabular
```

## Brand Core Palette

| Figma Name                  | Token Name         | Hex       | Usage                                                          |
| --------------------------- | ------------------ | --------- | -------------------------------------------------------------- |
| Color/Brand/Primary         | `primary`          | `#AF4424` | CTA utama, active navigation, primary progress, selected state |
| Color/Brand/Primary Hover   | `primary-hover`    | `#8C361D` | Hover/pressed state untuk primary button dan active controls   |
| Color/Brand/Primary Surface | `primary-surface`  | `#F3E3DE` | Soft highlight, selected card, subtle primary chip             |
| Color/Neutral/Text          | `foreground`       | `#25211E` | Heading, body utama, icon penting                              |
| Color/Neutral/Text Muted    | `muted-foreground` | `#625B54` | Secondary text, metadata, helper text                          |
| Color/Neutral/Border        | `border`           | `#E7DFD5` | Border card, divider, input border                             |
| Color/Neutral/Surface       | `muted`            | `#EEEAE4` | Neutral chip, inactive surface, empty state                    |
| Color/Neutral/Page          | `background-soft`  | `#FAF7F2` | Page background alternatif, section background lembut          |
| Color/Neutral/Card          | `card`             | `#FFFFFF` | Card, form surface, modal body                                 |

## Semantic Palette

Semantic colors dipakai untuk status, badges, feedback, dan action button yang
punya makna operasional. Warna ini sengaja dibuat lebih botanical-earth agar
tetap terasa Rumah Atsiri.

> Nilai solid semantic di bawah adalah nilai final untuk UI sistem ini. Nilai
> tersebut sengaja dibuat lebih gelap daripada exploratory brand swatch agar
> foreground putih pada action solid dan teks semantic pada surface memenuhi
> target kontras WCAG AA.

| Figma Name             | Token Name | Hex       | Meaning                             | Usage                                              |
| ---------------------- | ---------- | --------- | ----------------------------------- | -------------------------------------------------- |
| Color/Semantic/Success | `success`  | `#315F3A` | Berhasil, approved, settled         | Success text, approve button, success icon         |
| Color/Semantic/Warning | `warning`  | `#8A571F` | Perlu perhatian, revision requested | Revision action, warning copy, pending correction  |
| Color/Semantic/Pending | `pending`  | `#6F5D20` | Menunggu, sedang proses             | Pending approval, waiting badge, in-progress stage |
| Color/Semantic/Info    | `info`     | `#286B69` | Informasi netral                    | Partially approved, info callout, system note      |
| Color/Semantic/Danger  | `danger`   | `#B42318` | Ditolak, error, destructive         | Reject button, delete confirmation, critical error |
| Color/Semantic/Neutral | `neutral`  | `#625B54` | Tidak ada status khusus             | Draft, no status, inactive metadata                |

## Semantic Surface Palette

Surface colors dipakai untuk badge background, callout lembut, table status
cells, dan small cards. Pair surface dengan text semantic solid.

| Figma Name                     | Token Name        | Hex       | Pair With         |
| ------------------------------ | ----------------- | --------- | ----------------- |
| Color/Semantic/Success Surface | `success-surface` | `#E5F0E5` | `success #315F3A` |
| Color/Semantic/Warning Surface | `warning-surface` | `#F6E8D6` | `warning #8A571F` |
| Color/Semantic/Pending Surface | `pending-surface` | `#F2EACF` | `pending #6F5D20` |
| Color/Semantic/Info Surface    | `info-surface`    | `#DCEDEC` | `info #286B69`    |
| Color/Semantic/Danger Surface  | `danger-surface`  | `#FEE2E2` | `danger #B42318`  |
| Color/Semantic/Neutral Surface | `neutral-surface` | `#EEEAE4` | `neutral #625B54` |

## Foreground On Solid Colors

Gunakan foreground berikut untuk teks di atas filled button atau solid badge.

| Background        | Foreground | Usage                         |
| ----------------- | ---------- | ----------------------------- |
| `primary #AF4424` | `#FFFFFF`  | Primary button text           |
| `success #315F3A` | `#FFFFFF`  | Approve button text           |
| `warning #8A571F` | `#FFFFFF`  | Revision button text          |
| `pending #6F5D20` | `#FFFFFF`  | Pending solid label if needed |
| `info #286B69`    | `#FFFFFF`  | Info solid action text        |
| `danger #B42318`  | `#FFFFFF`  | Reject/delete button text     |
| `neutral #625B54` | `#FFFFFF`  | Neutral solid label text      |

## Typography

Font resmi sistem internal Rumah Atsiri: **Plus Jakarta Sans**, dimuat dari
Google Fonts. Satu keluarga ini dipakai untuk UI, heading, body, dan data agar
tampil lebih hangat serta konsisten di seluruh touchpoint internal.

| Figma Name        | Token Name     | Font              | Weight         | Size    | Usage                                |
| ----------------- | -------------- | ----------------- | -------------- | ------- | ------------------------------------ |
| Type/Display/H1   | `text-h1`      | Plus Jakarta Sans | Semibold       | 28–32px | Judul halaman                        |
| Type/Heading/H2   | `text-h2`      | Plus Jakarta Sans | Semibold       | 22–24px | Section header                       |
| Type/Heading/H3   | `text-h3`      | Plus Jakarta Sans | Medium         | 18px    | Card title / subsection              |
| Type/Body/Regular | `text-body`    | Plus Jakarta Sans | Regular        | 15–16px | Teks utama                           |
| Type/Body/Small   | `text-small`   | Plus Jakarta Sans | Regular        | 13px    | Metadata, timestamp, helper text     |
| Type/Caption      | `text-caption` | Plus Jakarta Sans | Medium         | 12px    | Label badge, table header            |
| Type/Data/Tabular | `text-data`    | Plus Jakarta Sans | Regular/Medium | 13–16px | Angka finansial, tabel BI, statistik |

Catatan pemakaian:

- Weight dipakai untuk hierarki, bukan pengganti warna — jangan mewarnai teks
  dengan semantic color hanya untuk menonjolkan, atur weight/ukuran dulu.
- `text-data` memakai Plus Jakarta Sans dengan `tabular-nums` untuk angka yang
  perlu align rapi di tabel/dashboard — bukan untuk body text biasa.
- Line-height body disarankan 1.5–1.6 (agak lega) agar keseluruhan UI tetap
  terasa calm sesuai brand wellness, bukan hanya mengandalkan warna.
- Muat Plus Jakarta Sans dari Google Fonts hanya pada weight yang dipakai:
  Regular (400), Medium (500), dan Semibold (600), dengan `display=swap`.
- Fallback stack: `"Plus Jakarta Sans", -apple-system, "Segoe UI", sans-serif`.

## Component Usage

### Buttons

| Button Type      | Background  | Text      | Hover           |
| ---------------- | ----------- | --------- | --------------- |
| Primary          | `#AF4424`   | `#FFFFFF` | `#8C361D`       |
| Approve          | `#315F3A`   | `#FFFFFF` | darker by 8-12% |
| Request Revision | `#8A571F`   | `#FFFFFF` | darker by 8-12% |
| Reject/Delete    | `#B42318`   | `#FFFFFF` | darker by 8-12% |
| Secondary        | `#FFFFFF`   | `#25211E` | `#FAF7F2`       |
| Outline          | transparent | `#25211E` | `#FAF7F2`       |

### Status Badges

Badge formula:

```text
background: semantic surface
text: semantic solid
border: semantic solid at 30-40% opacity
font: text-caption (Plus Jakarta Sans Medium, 12px)
```

| Status               | Tone    | Surface   | Text      |
| -------------------- | ------- | --------- | --------- |
| `approved`           | Success | `#E5F0E5` | `#315F3A` |
| `disbursed`          | Success | `#E5F0E5` | `#315F3A` |
| `settled`            | Success | `#E5F0E5` | `#315F3A` |
| `revision_requested` | Warning | `#F6E8D6` | `#8A571F` |
| `pending_supervisor` | Pending | `#F2EACF` | `#6F5D20` |
| `pending_hr`         | Pending | `#F2EACF` | `#6F5D20` |
| `pending_finance`    | Pending | `#F2EACF` | `#6F5D20` |
| `pending_ppic`       | Pending | `#F2EACF` | `#6F5D20` |
| `pending_purchasing` | Pending | `#F2EACF` | `#6F5D20` |
| `partially_approved` | Info    | `#DCEDEC` | `#286B69` |
| `rejected`           | Danger  | `#FEE2E2` | `#B42318` |
| unknown/no status    | Neutral | `#EEEAE4` | `#625B54` |

### Forms

| Element                 | Color                       |
| ----------------------- | --------------------------- |
| Input background        | `#FFFFFF`                   |
| Input border            | `#E7DFD5`                   |
| Input focus ring        | `#AF4424` at 30-40% opacity |
| Placeholder/helper text | `#625B54`                   |
| Error text              | `#B42318`                   |
| Disabled background     | `#EEEAE4`                   |

Label dan input text memakai `text-body` (Plus Jakarta Sans Regular); helper/error
text memakai `text-small`.

### Navigation

| State         | Background  | Text/Icon |
| ------------- | ----------- | --------- |
| Default       | transparent | `#625B54` |
| Hover         | `#FAF7F2`   | `#25211E` |
| Active        | `#AF4424`   | `#FFFFFF` |
| Active subtle | `#F3E3DE`   | `#AF4424` |

## Figma Variable Structure

Recommended Figma collections:

```text
Collection: Rumah Atsiri Colors

Mode: Light
  Brand
    Primary
    Primary Hover
    Primary Surface
  Neutral
    Text
    Text Muted
    Border
    Surface
    Page
    Card
  Semantic
    Success
    Success Surface
    Warning
    Warning Surface
    Pending
    Pending Surface
    Info
    Info Surface
    Danger
    Danger Surface
    Neutral
    Neutral Surface

Collection: Rumah Atsiri Typography (Text Styles, bukan Variables biasa)

  Display
    H1
  Heading
    H2
    H3
  Body
    Regular
    Small
  Caption
  Data
    Tabular
```

## CSS Token Draft

```css
:root {
    --primary: #af4424;
    --primary-hover: #8c361d;
    --primary-foreground: #ffffff;
    --primary-surface: #f3e3de;

    --foreground: #25211e;
    --muted-foreground: #625b54;
    --border: #e7dfd5;
    --muted: #eeeae4;
    --background-soft: #faf7f2;
    --background: var(--background-soft);
    --card: #ffffff;

    --success: #315f3a;
    --success-foreground: #ffffff;
    --success-surface: #e5f0e5;

    --warning: #8a571f;
    --warning-foreground: #ffffff;
    --warning-surface: #f6e8d6;

    --pending: #6f5d20;
    --pending-foreground: #ffffff;
    --pending-surface: #f2eacf;

    --info: #286b69;
    --info-foreground: #ffffff;
    --info-surface: #dcedec;

    --danger: #b42318;
    --danger-foreground: #ffffff;
    --danger-surface: #fee2e2;

    /* Compatibility alias untuk shadcn/ui destructive variants. */
    --destructive: var(--danger);
    --destructive-foreground: var(--danger-foreground);

    --neutral: #625b54;
    --neutral-foreground: #ffffff;
    --neutral-surface: #eeeae4;

    --font-sans: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', sans-serif;

    --text-h1: 600 28px/1.3 var(--font-sans);
    --text-h2: 600 22px/1.35 var(--font-sans);
    --text-h3: 500 18px/1.4 var(--font-sans);
    --text-body: 400 16px/1.6 var(--font-sans);
    --text-small: 400 13px/1.5 var(--font-sans);
    --text-caption: 500 12px/1.4 var(--font-sans);
    --text-data: 400 15px/1.5 var(--font-mono);
}
```

## Current Project Tracker Status Mapping

Mapping ini adalah aturan semantik yang dipakai oleh badge, callout, chart,
dan status label di sistem ini.

| Area | Status | Semantic token |
| ---- | ------ | -------------- |
| Project | `planning`, `in_progress`, `completed_pending_deployment` | `pending` |
| Project | `on_hold` | `warning` |
| Project | `deployed_running` | `success` |
| Project | `deployed_maintenance` | `info` |
| Brief Feature | `todo` | `neutral` |
| Brief Feature | `in_progress` | `pending` |
| Brief Feature | `done` | `success` |
| Issue / Feature Request | `open` | `info` |
| Issue / Feature Request | `in_progress` | `pending` |
| Issue / Feature Request | `resolved` / `fulfilled` | `success` |
| Semua area | `overdue`, `rejected`, `error` | `danger` |
| Semua area | unknown / tanpa status | `neutral` |

## Implementation Contract

- Filled action memakai `bg-{semantic}` dan
  `text-{semantic}-foreground`; jangan hardcode `text-white`.
- Badge dan callout memakai formula
  `border-{semantic}/20–30 bg-{semantic}-surface text-{semantic}`.
- `primary` hanya untuk brand action, active navigation, dan progress utama;
  jangan dipakai untuk status workflow.
- `destructive` hanya compatibility alias untuk komponen shadcn/ui lama dan
  harus menunjuk ke `danger`; kode baru memakai `danger` secara langsung.
- Export PDF/PNG dan asset favicon harus memakai nilai token yang sama dengan
  frontend utama.
- Theme yang didukung saat ini adalah Light; hook `.dark` yang dihasilkan
  shadcn/ui tetap diarahkan ke token semantic yang sama sampai dark palette
  didefinisikan secara terpisah.

## Implementation Notes

- Gunakan `primary` hanya untuk brand action dan active navigation.
- Jangan memakai raw Tailwind colors seperti `bg-emerald-50` atau `text-blue-700`.
- Untuk status, gunakan semantic tokens agar semua halaman dan komponen sistem
  ini konsisten.
- Filled action buttons sebaiknya memakai solid semantic token, bukan surface.
- Badge dan callout sebaiknya memakai surface + text semantic solid.
- Warna danger harus lebih tegas dari primary agar action destructive tidak
  terbaca sebagai aksi brand biasa. Tone-nya tetap clay/rust agar brand-aligned.
- Info menggunakan eucalyptus teal agar tidak terasa seperti corporate blue.
- Jangan memakai font di luar Plus Jakarta Sans di sistem manapun (One Access,
  BI Dashboard, expense workflow, dsb) — konsistensi brand lintas touchpoint
  lebih diutamakan daripada eksperimen tipografi.
- Angka di tabel/dashboard BI wajib pakai `text-data` (Plus Jakarta Sans dengan
  `tabular-nums`) supaya kolom angka align rapi.

## Accessibility Notes

- Teks putih di atas primary, success, warning, info, danger, dan neutral aman
  untuk filled button/action dengan nilai solid canonical di dokumen ini.
- Untuk teks kecil pada badge, gunakan surface background dan text solid.
- Jangan gunakan surface color sebagai teks.
- Jangan gunakan semantic color hanya sebagai satu-satunya pembeda status.
  Tetap sertakan label status atau icon.
- Jangan mengganti nilai solid semantic dengan swatch yang lebih terang tanpa
  mengulang pemeriksaan kontras untuk foreground putih dan seluruh semantic
  surface pairing.
- Pastikan kontras teks vs background minimal WCAG AA (4.5:1) untuk seluruh
  kombinasi `text-body`/`text-small`/`text-caption` di atas warna neutral
  maupun semantic surface manapun.
