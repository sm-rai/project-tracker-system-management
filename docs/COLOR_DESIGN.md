# Rumah Atsiri Color & Typography Design System

Dokumen ini adalah acuan awal untuk membuat color & typography design system di
Figma dan menjaga konsistensi implementasi frontend lintas sistem internal
Rumah Atsiri Indonesia.

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
| Color/Neutral/Text Muted    | `muted-foreground` | `#756E66` | Secondary text, metadata, helper text                          |
| Color/Neutral/Border        | `border`           | `#E7DFD5` | Border card, divider, input border                             |
| Color/Neutral/Surface       | `muted`            | `#EEEAE4` | Neutral chip, inactive surface, empty state                    |
| Color/Neutral/Page          | `background-soft`  | `#FAF7F2` | Page background alternatif, section background lembut          |
| Color/Neutral/Card          | `card`             | `#FFFFFF` | Card, form surface, modal body                                 |

## Semantic Palette

Semantic colors dipakai untuk status, badges, feedback, dan action button yang
punya makna operasional. Warna ini sengaja dibuat lebih botanical-earth agar
tetap terasa Rumah Atsiri.

| Figma Name             | Token Name | Hex       | Meaning                             | Usage                                              |
| ---------------------- | ---------- | --------- | ----------------------------------- | -------------------------------------------------- |
| Color/Semantic/Success | `success`  | `#3F7A4A` | Berhasil, approved, settled         | Success text, approve button, success icon         |
| Color/Semantic/Warning | `warning`  | `#B9772E` | Perlu perhatian, revision requested | Revision action, warning copy, pending correction  |
| Color/Semantic/Pending | `pending`  | `#9C842F` | Menunggu, sedang proses             | Pending approval, waiting badge, in-progress stage |
| Color/Semantic/Info    | `info`     | `#2F7C7A` | Informasi netral                    | Partially approved, info callout, system note      |
| Color/Semantic/Danger  | `danger`   | `#DC2626` | Ditolak, error, destructive         | Reject button, delete confirmation, critical error |
| Color/Semantic/Neutral | `neutral`  | `#756E66` | Tidak ada status khusus             | Draft, no status, inactive metadata                |

## Semantic Surface Palette

Surface colors dipakai untuk badge background, callout lembut, table status
cells, dan small cards. Pair surface dengan text semantic solid.

| Figma Name                     | Token Name        | Hex       | Pair With         |
| ------------------------------ | ----------------- | --------- | ----------------- |
| Color/Semantic/Success Surface | `success-surface` | `#E5F0E5` | `success #3F7A4A` |
| Color/Semantic/Warning Surface | `warning-surface` | `#F6E8D6` | `warning #B9772E` |
| Color/Semantic/Pending Surface | `pending-surface` | `#F2EACF` | `pending #9C842F` |
| Color/Semantic/Info Surface    | `info-surface`    | `#DCEDEC` | `info #2F7C7A`    |
| Color/Semantic/Danger Surface  | `danger-surface`  | `#FEE2E2` | `danger #DC2626`  |
| Color/Semantic/Neutral Surface | `neutral-surface` | `#EEEAE4` | `neutral #756E66` |

## Foreground On Solid Colors

Gunakan foreground berikut untuk teks di atas filled button atau solid badge.

| Background        | Foreground | Usage                         |
| ----------------- | ---------- | ----------------------------- |
| `primary #AF4424` | `#FFFFFF`  | Primary button text           |
| `success #3F7A4A` | `#FFFFFF`  | Approve button text           |
| `warning #B9772E` | `#FFFFFF`  | Revision button text          |
| `pending #9C842F` | `#FFFFFF`  | Pending solid label if needed |
| `info #2F7C7A`    | `#FFFFFF`  | Info solid action text        |
| `danger #DC2626`  | `#FFFFFF`  | Reject/delete button text     |
| `neutral #756E66` | `#FFFFFF`  | Neutral solid label text      |

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
| Approve          | `#3F7A4A`   | `#FFFFFF` | darker by 8-12% |
| Request Revision | `#B9772E`   | `#FFFFFF` | darker by 8-12% |
| Reject/Delete    | `#DC2626`   | `#FFFFFF` | darker by 8-12% |
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
| `approved`           | Success | `#E5F0E5` | `#3F7A4A` |
| `disbursed`          | Success | `#E5F0E5` | `#3F7A4A` |
| `settled`            | Success | `#E5F0E5` | `#3F7A4A` |
| `revision_requested` | Warning | `#F6E8D6` | `#B9772E` |
| `pending_supervisor` | Pending | `#F2EACF` | `#9C842F` |
| `pending_hr`         | Pending | `#F2EACF` | `#9C842F` |
| `pending_finance`    | Pending | `#F2EACF` | `#9C842F` |
| `pending_ppic`       | Pending | `#F2EACF` | `#9C842F` |
| `pending_purchasing` | Pending | `#F2EACF` | `#9C842F` |
| `partially_approved` | Info    | `#DCEDEC` | `#2F7C7A` |
| `rejected`           | Danger  | `#FEE2E2` | `#DC2626` |
| unknown/no status    | Neutral | `#EEEAE4` | `#756E66` |

### Forms

| Element                 | Color                       |
| ----------------------- | --------------------------- |
| Input background        | `#FFFFFF`                   |
| Input border            | `#E7DFD5`                   |
| Input focus ring        | `#AF4424` at 30-40% opacity |
| Placeholder/helper text | `#756E66`                   |
| Error text              | `#DC2626`                   |
| Disabled background     | `#EEEAE4`                   |

Label dan input text memakai `text-body` (Plus Jakarta Sans Regular); helper/error
text memakai `text-small`.

### Navigation

| State         | Background  | Text/Icon |
| ------------- | ----------- | --------- |
| Default       | transparent | `#756E66` |
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
    --muted-foreground: #756e66;
    --border: #e7dfd5;
    --muted: #eeeae4;
    --background-soft: #faf7f2;
    --card: #ffffff;

    --success: #3f7a4a;
    --success-foreground: #ffffff;
    --success-surface: #e5f0e5;

    --warning: #b9772e;
    --warning-foreground: #ffffff;
    --warning-surface: #f6e8d6;

    --pending: #9c842f;
    --pending-foreground: #ffffff;
    --pending-surface: #f2eacf;

    --info: #2f7c7a;
    --info-foreground: #ffffff;
    --info-surface: #dcedec;

    --danger: #dc2626;
    --danger-foreground: #ffffff;
    --danger-surface: #fee2e2;

    --neutral: #756e66;
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

## Implementation Notes

- Gunakan `primary` hanya untuk brand action dan active navigation.
- Jangan memakai raw Tailwind colors seperti `bg-emerald-50` atau `text-blue-700`.
- Untuk status, gunakan semantic tokens agar semua sistem internal konsisten.
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

- Teks putih di atas primary, success, warning, info, dan danger aman untuk
  button/action besar.
- Untuk teks kecil pada badge, gunakan surface background dan text solid.
- Jangan gunakan surface color sebagai teks.
- Jangan gunakan semantic color hanya sebagai satu-satunya pembeda status.
  Tetap sertakan label status atau icon.
- Pastikan kontras teks vs background minimal WCAG AA (4.5:1) untuk seluruh
  kombinasi `text-body`/`text-small`/`text-caption` di atas warna neutral
  maupun semantic surface manapun.
