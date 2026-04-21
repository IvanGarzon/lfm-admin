# LFM Admin — Design System

Florist business operations platform. Internal staff-facing admin tool.

**Style:** Soft UI Evolution — subtle depth, modern shadows, WCAG AA+
**Stack:** Next.js, Tailwind CSS v4, shadcn/ui

---

## Typography

**Font:** Plus Jakarta Sans (Google Fonts)
**Rationale:** Professional authority with approachable warmth. Excellent weight range for admin UI hierarchy. Better personality than Inter without sacrificing legibility.

### Type Scale

| Role       | Size | Weight | Line Height | Tailwind                        |
| ---------- | ---- | ------ | ----------- | ------------------------------- |
| Display    | 32px | 800    | 1.1         | `text-3xl font-extrabold`       |
| Heading 1  | 24px | 700    | 1.2         | `text-2xl font-bold`            |
| Heading 2  | 20px | 700    | 1.25        | `text-xl font-bold`             |
| Heading 3  | 18px | 600    | 1.3         | `text-lg font-semibold`         |
| Card Title | 16px | 600    | 1.4         | `text-base font-semibold`       |
| Body       | 14px | 400    | 1.5         | `text-sm`                       |
| Label / UI | 14px | 500    | 1.4         | `text-sm font-medium`           |
| Caption    | 12px | 400    | 1.4         | `text-xs text-muted-foreground` |

### Rules

- Minimum body size 14px (admin tool, dense UI acceptable)
- Heading weight 700–800, body weight 400, labels 500–600
- Letter spacing: default on body, slight tracking (`tracking-tight`) on large headings

---

## Colour Tokens

All tokens live in `src/app/globals.css` under `@layer base :root` / `.dark`.

### Light Mode

| Token                  | CSS Variable               | HSL             | Hex       |
| ---------------------- | -------------------------- | --------------- | --------- |
| Background             | `--background`             | `250 14% 98%`   | `#F8F7FA` |
| Foreground             | `--foreground`             | `270 43% 11%`   | `#1C1028` |
| Card                   | `--card`                   | `0 0% 100%`     | `#FFFFFF` |
| Card Foreground        | `--card-foreground`        | `270 43% 11%`   | `#1C1028` |
| Popover                | `--popover`                | `0 0% 100%`     | `#FFFFFF` |
| Popover Foreground     | `--popover-foreground`     | `270 43% 11%`   | `#1C1028` |
| Primary                | `--primary`                | `252 100% 65%`  | `#6D4AFF` |
| Primary Foreground     | `--primary-foreground`     | `0 0% 100%`     | `#FFFFFF` |
| Secondary              | `--secondary`              | `252 100% 97%`  | `#F3F0FF` |
| Secondary Foreground   | `--secondary-foreground`   | `252 100% 45%`  | `#4B26CC` |
| Muted                  | `--muted`                  | `252 100% 97%`  | `#F3F0FF` |
| Muted Foreground       | `--muted-foreground`       | `252 15% 45%`   | `#6B6484` |
| Accent                 | `--accent`                 | `252 100% 95%`  | `#EAE4FF` |
| Accent Foreground      | `--accent-foreground`      | `252 100% 45%`  | `#4B26CC` |
| Border                 | `--border`                 | `252 95% 92%`   | `#DDD6FE` |
| Input                  | `--input`                  | `252 95% 92%`   | `#DDD6FE` |
| Ring                   | `--ring`                   | `252 100% 65%`  | `#6D4AFF` |
| Destructive            | `--destructive`            | `0 84.2% 60.2%` | `#EF4444` |
| Destructive Foreground | `--destructive-foreground` | `0 0% 98%`      | `#FAFAFA` |

### Dark Mode

Dark mode is purple-based, already configured. Key values:

| Token      | HSL           |
| ---------- | ------------- |
| Background | `253 43% 3%`  |
| Primary    | `253 91% 58%` |
| Ring       | `253 91% 58%` |

### Semantic Colour Usage

| Use                                   | Token              |
| ------------------------------------- | ------------------ |
| Primary buttons, links, active states | `primary`          |
| Hover backgrounds on nav/menu items   | `accent`           |
| Disabled / subtle surfaces            | `muted`            |
| Input borders                         | `border` / `input` |
| Focus rings                           | `ring`             |
| Delete, remove, error actions         | `destructive`      |

### Brand Colours (not in shadcn tokens)

Use directly as Tailwind classes where needed:

| Name         | Hex                    | Usage                             |
| ------------ | ---------------------- | --------------------------------- |
| Floral Pink  | `#EC4899` (`pink-500`) | Accent CTAs, badges, highlights   |
| Purple Light | `#9B7BFF`              | Gradient endpoints, illustrations |

---

## Spacing

4px base unit. All spacing values are multiples of 4.

| Token   | Value | Usage                 |
| ------- | ----- | --------------------- |
| `gap-1` | 4px   | Tight inline elements |
| `gap-2` | 8px   | Form field internals  |
| `gap-3` | 12px  | Related field groups  |
| `gap-4` | 16px  | Card sections         |
| `gap-6` | 24px  | Between card blocks   |
| `gap-8` | 32px  | Page-level sections   |
| `p-4`   | 16px  | Compact card padding  |
| `p-6`   | 24px  | Standard card padding |
| `p-8`   | 32px  | Page-level padding    |
| `p-10`  | 40px  | Auth/focus layouts    |

---

## Border Radius

Set via `--radius: 0.625rem` in CSS variables.

| Token          | Value                        | Usage                |
| -------------- | ---------------------------- | -------------------- |
| `rounded-sm`   | `calc(0.625rem - 4px)` ≈ 6px | Badges, tags         |
| `rounded-md`   | `calc(0.625rem - 2px)` ≈ 8px | Inputs, buttons      |
| `rounded-lg`   | `0.625rem` = 10px            | Cards, dropdowns     |
| `rounded-xl`   | 12px                         | Large cards, modals  |
| `rounded-2xl`  | 16px                         | Sheet panels         |
| `rounded-full` | 9999px                       | Avatars, pill badges |

---

## Shadows

Soft UI Evolution — shadows should feel subtle and purposeful, not decorative.

| Level | Class       | Usage                      |
| ----- | ----------- | -------------------------- |
| 0     | none        | Flat elements on surface   |
| 1     | `shadow-sm` | Cards, inputs on focus     |
| 2     | `shadow-md` | Dropdowns, popovers        |
| 3     | `shadow-lg` | Modals, sheets             |
| 4     | `shadow-xl` | Command palette, spotlight |

Tint shadows with primary colour where appropriate:

```css
box-shadow: 0 2px 8px rgb(109 74 255 / 0.12);
```

---

## Animation

| Type                              | Duration | Easing                          |
| --------------------------------- | -------- | ------------------------------- |
| Micro-interactions (hover, focus) | 150ms    | `ease-out`                      |
| State transitions (open/close)    | 200ms    | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Page transitions                  | 300ms    | `ease-out`                      |
| Exit animations                   | 150ms    | `ease-in`                       |

Always respect `prefers-reduced-motion`.

---

## Component Defaults

### Buttons

| Variant             | Use                                 |
| ------------------- | ----------------------------------- |
| `default` (primary) | Main CTA per screen — one per view  |
| `secondary`         | Secondary actions                   |
| `outline`           | Tertiary, paired with primary       |
| `ghost`             | Inline/nav actions                  |
| `destructive`       | Delete, remove — visually separated |

### Forms

- Label above input, never placeholder-only
- Error message below the field
- Validate on blur, not on keystroke
- `input` border token on idle, `ring` token on focus
- Minimum input height 40px

### Badges

Status badges use `variant="outline"` with className overrides following the `{color}-50/700/200` light + `{color}-950/400/800` dark pattern.

| Colour | Light                                            | Dark                                                             | Use                        |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------- | -------------------------- |
| Green  | `bg-green-50 text-green-700 border-green-200`    | `dark:bg-green-950 dark:text-green-400 dark:border-green-800`    | Active, paid, complete     |
| Gray   | `bg-gray-50 text-gray-700 border-gray-200`       | `dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700`       | Draft, inactive, neutral   |
| Yellow | `bg-yellow-50 text-yellow-700 border-yellow-200` | `dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800` | Pending, warning           |
| Blue   | `bg-blue-50 text-blue-700 border-blue-200`       | `dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800`       | Sent, running, info        |
| Purple | `bg-purple-50 text-purple-700 border-purple-200` | `dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800` | Overdue, converted, custom |
| Red    | `bg-red-50 text-red-700 border-red-200`          | `dark:bg-red-950 dark:text-red-400 dark:border-red-800`          | Cancelled, error, deleted  |
| Amber  | `bg-amber-50 text-amber-700 border-amber-200`    | `dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800`    | On hold, on leave          |
| Orange | `bg-orange-50 text-orange-700 border-orange-200` | `dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800` | Expired, timeout, cleanup  |
| Pink   | `bg-pink-50 text-pink-700 border-pink-200`       | `dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800`       | Rejected, floral, featured |
| Indigo | `bg-indigo-50 text-indigo-700 border-indigo-200` | `dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800` | Manager role               |

Badge component variants (`success`, `warning`) use solid bg and work in both modes.

---

## Files

| File                                  | Purpose                             |
| ------------------------------------- | ----------------------------------- |
| `src/app/globals.css`                 | All CSS variables + Tailwind @theme |
| `src/app/layout.tsx`                  | Font loading (Plus Jakarta Sans)    |
| `docs/design-system/DESIGN-SYSTEM.md` | This file                           |
