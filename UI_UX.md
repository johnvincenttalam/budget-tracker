# UI/UX Design System

Design reference for the Budget Tracker app. Apple-inspired, dark-first, mobile-optimized.

---

## Color System

### Dark Mode (default)

| Token | Value | Usage |
|-------|-------|-------|
| `surface-primary` | `#000000` | Page background |
| `surface-secondary` | `#1C1C1E` | Cards, inputs |
| `surface-tertiary` | `#2C2C2E` | Elevated elements, dividers |
| `text-primary` | `#FFFFFF` | Headings, primary text |
| `text-secondary` | `#AEAEB2` | Labels, secondary info |
| `text-muted` | `#636366` | Captions, placeholders |
| `emerald-500` | `#34C759` | Primary accent, CTAs |
| `emerald-400` | `#30D158` | Active nav items, positive values |

### Light Mode

Colors invert through CSS variable swapping on `[data-theme="light"]`. The slate scale flips (950 becomes white, 900 becomes `#F2F2F7`, etc.) while accent colors adjust for contrast. Colored backgrounds (`bg-emerald-500`, `bg-red-500`, etc.) retain white text.

### Accent Colors

| Color | Usage |
|-------|-------|
| Emerald | Income, positive, primary actions |
| Red | Expenses, negative, danger/delete |
| Blue | Transfers, "needs" tag |
| Purple | "Wants" tag |
| Amber | Warnings, budget near limit |

---

## Typography

**Font:** Plus Jakarta Sans (Google Fonts), falling back to system-ui / -apple-system.

| Token | Size | Usage |
|-------|------|-------|
| `text-hero` | 2.25rem (36px) | Dashboard balance |
| `text-title` | 1rem (16px) | Screen titles, card headings |
| `text-body` | 0.875rem (14px) | Transaction labels, content |
| `text-caption` | 0.75rem (12px) | Dates, secondary labels |
| `text-micro` | 0.625rem (10px) | Tags, section headers, pills |

Section headers use `uppercase tracking-wider` for visual hierarchy.

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-page-x` | 1.25rem (`px-5`) | Horizontal page padding |
| `spacing-section-gap` | 0.75rem (`gap-3`) | Between sections/cards |
| `spacing-bottom-safe` | 6.5rem (`pb-[6.5rem]`) | Bottom padding above nav bar |

The bottom padding is applied once by the App.tsx wrapper — individual screens should not add their own.

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-card` | 1.25rem (20px) | Cards, modal sheets |
| `radius-button` | 0.75rem (12px) | Buttons, inputs, chips |
| `radius-pill` | 9999px | Tags, badges, wallet chips |

---

## Shared Components

### Card
Rounded container with size variants.
- **Sizes:** `sm` (p-3), `md` (p-4), `lg` (p-5)
- **Style:** `bg-slate-900 rounded-[1.25rem]`
- **Optional:** ring border, click handler with active press effect

### Button
Four variants with active scale animation (`active:scale-[0.98]`).
- **Primary:** `bg-emerald-500 text-white`
- **Secondary:** `bg-slate-800 text-slate-200`
- **Ghost:** transparent, text-only
- **Danger:** `bg-red-500/15 text-red-400`

### Input
Labeled text input.
- **Style:** `bg-slate-800 rounded-xl px-4 py-3`
- **Focus:** `focus:ring-2 focus:ring-emerald-500/40 transition-shadow`
- **Label:** uppercase 10px slate-500

### BottomSheet
Drag-to-dismiss modal drawer.
- Backdrop: `bg-black/70`
- Max height: `90dvh`, scrollable content
- Drag handle at top, dismisses on >100px drag
- Slide-up entry animation

### Toast
Auto-dismissing notification at bottom.
- Positioned above bottom nav with safe area offset
- Optional action button (emerald-400)
- Default duration: 5 seconds with fade-out exit

### ProgressBar
Horizontal fill indicator.
- Track: `bg-slate-700 h-1.5 rounded-full`
- Fill: emerald-500, animated 500ms ease-out
- Clamps to 0–100%

### ChipToggle
Segmented pill selector for filtering/toggling.
- Active: emerald-500 (or custom color), inactive: slate-900
- `rounded-full px-4 py-2 text-sm`

### AnimatedNumber
Smooth counter transition using requestAnimationFrame.
- Ease-out cubic easing, 400ms default
- Supports custom formatters (e.g. currency)

### WalletPicker
Horizontal scrollable chip row for selecting an account.
- Selected chip uses the wallet's assigned color
- Adapts background based on surface context (page vs sheet)

### EmptyState
Centered placeholder for empty lists.
- Circular icon container, title, optional description
- `py-10` vertical padding

### SkeletonLoader
Shimmer loading placeholders.
- Variants: text, circle, card
- Uses shimmer keyframe animation (1.5s infinite)

### BudgetProgress
Budget vs actual spending bar.
- Color-coded: green (<80%), amber (80–99%), red (100%+)
- Shows overspend amount when exceeded

---

## Navigation & Layout

### App Shell
- Max-width `2xl`, centered, `min-h-dvh`
- Content area gets `pb-[6.5rem]` to clear bottom nav

### Top Bar
- Sticky, `z-30`, `backdrop-blur-xl`
- `bg-slate-950/95 border-b border-slate-800/30`
- Hamburger menu (left) + screen title (center)
- Hidden on form/edit screens and lock screen

### Bottom Navigation
- Fixed bottom, `z-50`, safe area inset padding
- 5 slots: **Home** | **Bills** | **FAB** | **Savings** | **Accounts**
- Active icon: emerald-400, inactive: slate-400
- Labels in text-micro below icons

### Floating Action Button (FAB)
- Center of bottom nav, elevated with `-mt-8`
- `bg-emerald-500 rounded-full w-14 h-14`
- Rotates 45 degrees on open
- Opens a mini-menu: Add Income (emerald) + Add Expense (red)
- Haptic feedback on tap

### Side Menu
- Slide-in drawer from left, `w-72`, `z-70`
- Backdrop overlay at `z-60`
- Menu items: Summary, Analytics, Recurring, Debts, Receivables, Accounts, Wishlist, Monthly Report, Settings
- Active item: `bg-emerald-500/15 text-emerald-400`

---

## Animations

All animations use snappy, iOS-style curves.

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fade-in` | 200ms | ease-out | Screen transitions |
| `slide-up` | 250ms | ease-out | Modals, bottom sheets |
| `slide-right` | 250ms | ease-out | Side menu |
| `scale-in` | 250ms | cubic-bezier(0.34, 1.56, 0.64, 1) | FAB menu items |
| `pop` | 300ms | cubic-bezier(0.34, 1.56, 0.64, 1) | FAB action buttons |
| `reveal-up` | 400ms | ease-out | Staggered card entry on dashboard |
| `reveal-scale` | 350ms | ease-out | Card scale-in on load |
| `success` | 500ms | spring curve | Completion feedback |
| `shake` | 400ms | ease-in-out | Error/validation feedback |
| `shimmer` | 1500ms | infinite | Skeleton loaders |
| `fade-out` | 200ms | ease-in | Toast/element exit |

Staggered entry on dashboard uses `animationDelay` increments (e.g. 0ms, 100ms, 200ms...).

---

## Theming

- Theme stored in Zustand, applied via `data-theme` attribute on `<html>`
- Transitions scoped to `.theme-transition` class (not blanket `*`) to avoid animation jank
- `color-scheme` set per theme selector for native form controls
- Preload script in `index.html` applies theme before first paint (no flash)

---

## Interaction Patterns

- **Tap highlight:** disabled globally (`-webkit-tap-highlight-color: transparent`)
- **Active press:** buttons use `active:scale-[0.98]` for tactile feedback
- **Drag-to-dismiss:** bottom sheets close on >100px downward drag
- **Swipe delete:** tap once for `×`, tap again for "Sure?" confirmation
- **Overscroll:** disabled (`overscroll-behavior: none`) for native-app feel
- **Haptic feedback:** triggered on FAB tap (where supported)
- **Safe areas:** bottom nav respects `env(safe-area-inset-bottom)` for notched devices
