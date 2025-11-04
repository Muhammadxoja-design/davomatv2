# Design Guidelines - Maktab Davomat Boshqaruv Tizimi

## Design Framework
Custom system merging Material Design's data components with Apple HIG's clarity. Professional educational platform for Uzbek language with hierarchical admin workflows (Super Admin → Maktab Admin → Sinf Admin). Focus: Real-time data visibility, institutional trust, crystal-clear hierarchy.

## Colors

**Primary Palette:**
- `#1E40AF` Primary Blue - CTAs, active states
- `#1E3A8A` Deep Blue - Headers, navigation
- `#0EA5E9` Sky Blue - Links, secondary actions
- `#FFFFFF` White - Cards, backgrounds
- `#F8FAFC` Light Gray - Page backgrounds, disabled
- `#334155` Dark Gray - Body text

**Semantic:**
- Success/Present: `#10B981` | Warning/Late: `#F59E0B` | Error/Absent: `#EF4444` | Info/Excused: `#3B82F6`

**Dark Mode:**
- Background: `#0F172A` | Cards: `#1E293B` (semi-transparent) | Primary: `#60A5FA` | Text: `#F1F5F9`

## Typography

**Fonts (Google CDN):**
- **Inter** - UI/body (Latin + Cyrillic)
- **Manrope** - Headers/titles (excellent Uzbek support)
- **Roboto Mono** - Statistics, IDs, codes

**Scale:**
- Hero: `text-3xl md:text-4xl` (Manrope, font-bold)
- Page Headers: `text-2xl` (Manrope, font-semibold)
- Sections: `text-xl` (Manrope, font-semibold)
- Cards: `text-lg` (Inter, font-semibold)
- Body: `text-base` (Inter, normal)
- Labels: `text-sm` (Inter, medium)
- Captions: `text-xs` (Inter, normal)

**Uzbek Considerations:** Line-height 1.6, 16px base font, Unicode support for oʻ, gʻ, sh, ch

## Layout

**Spacing (Tailwind units):** 4, 6 (internal) | 6, 8 (cards) | 12, 16 (sections) | 16, 24 (page margins)

**Responsive Grids:**
- Stats: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- Cards: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`
- Forms: Single-col (mobile), 2-col related fields (desktop)

**Structure:**
- Sidebar: 280px fixed (desktop), collapsible icon-only (tablet), bottom nav (mobile)
- Top Bar: h-16, breadcrumbs left, search/notifications/toggles/profile right
- Main: `max-w-7xl px-6 py-8`

## Dashboard Layouts

**Super Admin:**
1. 4 KPI cards: Regions, Schools, Attendance Rate, Active Users (text-4xl, gradient backgrounds, trends)
2. Regional overview table/map with filters
3. School leaderboard (top 10 / bottom 10)
4. Real-time system activity feed

**Maktab Admin:**
1. 4 KPIs: Classes, Students, Today's Rate, Pending Actions
2. Real-time attendance monitor (2/3 width, live class breakdown)
3. Weekly trends chart
4. Student management quick access

**Sinf Admin:**
1. Class stats banner + photo collage
2. Student grid (3-6 cols responsive, photos, status, one-tap update)
3. Attendance capture interface (big CTA, photo upload, batch tools)
4. 7-day calendar per-student view

## Components

**Navigation Sidebar:**
- Logo: h-20 | Items: `py-3 px-4`, 24px icons, badge for notifications
- Active: Blue gradient bg, white text | Hover: Lighter blue
- Role indicator badge at top

**Top Bar:**
- Breadcrumbs: `text-sm` left | Search: expandable `w-64→w-96` center-left
- Icons: 40x40, tooltips | Profile: Avatar + name + role badge

**Data Cards:**
```css
rounded-xl p-6 md:p-8 shadow-md
border-1 blue accent (light) / glow (dark)
Header: 40x40 icon circle, title, text-3xl value
Footer: Trend + comparison
```

**Tables:**
- Sticky header: `bg-blue-50` (light) / `bg-blue-900/30` (dark)
- Rows: `py-4 px-6`, hover `bg-blue-50`
- Photos: 48x48 rounded-full | Status: Pill badges
- Pagination center-bottom

**Forms:**
```css
Labels: text-sm font-medium mb-2, red asterisk required
Inputs: h-12 px-4 rounded-lg border-2 focus:ring-2 ring-blue-500
Layout: 2-col for related fields (desktop)
File upload: Drag-drop zone with preview
```

**Buttons:**
- Primary: `bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 text-white font-semibold`
- Secondary: `border-2 border-blue-600 text-blue-600 hover:bg-blue-50`
- Success: `bg-green-600` | Danger: `bg-red-600`
- Icon: 40x40 rounded-lg | FAB: Fixed bottom-right, rounded-full

**Status Badges:**
```css
rounded-full px-3 py-1 text-xs font-medium
Present: bg-green-100 text-green-800 border-green-200
Absent: bg-red-100 text-red-800 border-red-200
Late: bg-amber-100 text-amber-800 border-amber-200
Excused: bg-blue-100 text-blue-800 border-blue-200
```

**Modals:**
```css
Overlay: backdrop-blur-sm bg-black/50
Card: max-w-2xl rounded-2xl centered
Header: py-4 px-6 border-b text-xl + close
Body: p-6 max-h-96 overflow-y-auto
Footer: px-6 py-4 border-t, buttons right
```

**Charts (ApexCharts):**
- Blue gradients, rounded bars, smooth curves
- Tooltips: Custom blue accent
- Legends: Bottom-center (horizontal) / Right (vertical)

**Student/Class Cards:**
```css
Photo: 120x120 rounded-lg top
Name: text-lg font-semibold truncate
Meta: Role/class, ID (Roboto Mono)
Badge: top-right corner
Hover: shadow-lg -translate-y-1 (200ms)
```

## Attendance Capture

**Photo Upload:**
- Dashed border dropzone (blue on drag)
- Thumbnails: 150x150 rounded-lg with delete overlay
- Lightbox modal, metadata display

**Student Grid:**
- 2-5 cols responsive
- Cards: Photo, name, status toggle, color-coded quick-mark icons
- Batch mode: Checkboxes + "Mark all as" dropdown
- Search bar: Instant filter

## Auth & Reports

**Login:**
- Centered card on gradient blue bg
- Logo + phone input + OTP + role selector (radio cards)
- Language switcher top-right (UZ/RU/EN flags)

**Reports:**
- Left filter sidebar 280px (date, school/class/student multi-select)
- Export: Excel, PDF, Print (top-right)
- Toggle: Chart / Table / Summary views

**Analytics:**
- Time selector (Today/Week/Month/Year/Custom)
- KPI comparison cards vs previous period
- Charts: Bar (by class), Line (daily), Donut (status)

## Images & Placeholders

**No hero images** - Data-first dashboards with subtle geometric patterns/gradient meshes
**Photos:** Student headshots, class photos, school logos
**Placeholders:** Initials in blue gradient circle | Loading: Skeleton shimmer

## Mobile

- Bottom nav: 5 actions (Dashboard, Attendance, Students, Reports, Profile)
- Hamburger for secondary nav | Swipeable cards
- Touch: Min 44x44px | Simplified single-metric chart views

## Accessibility (WCAG AA)

- Contrast: 4.5:1 body, 3:1 large text
- Keyboard: Full tab order, Enter/Space, Escape to close
- Screen readers: ARIA labels, live regions for real-time
- Focus: 2px blue ring
- Forms: Inline validation with descriptions
- Lang: `lang="uz"` attribute

## Animations (Purposeful Only)

- Button hover: `scale-102` + brightness (instant)
- Card hover: `shadow-lg -translate-y-1` (200ms)
- Page: Fade-in (300ms) | Real-time: Pulse (500ms)
- Success: Checkmark scale-in | Loading: Shimmer/spinner
**Avoid:** Parallax, continuous loops, scroll effects

## Dark/Light Toggle

Icon button (sun/moon) in top bar, persists to localStorage
- **Light:** White bg, blue accents, subtle shadows
- **Dark:** Navy `#0F172A`, semi-transparent blurred cards, lighter blue, soft glows

---

**Implementation Priority:** Data visibility > Visual decoration. Clear role-based hierarchies. Professional Uzbek educational context. Real-time updates without overwhelm.