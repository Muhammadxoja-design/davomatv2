# Design Guidelines - School Attendance Management System

## Design Approach

**Framework**: Custom design system inspired by Vision UI Dashboard with Material Design principles for data-heavy components. This creates a modern, professional educational technology platform that balances visual appeal with functional clarity.

**Core Philosophy**: 
- Trustworthy and professional for educational institutions
- Engaging and accessible for students and parents
- Efficient and clear for daily administrative tasks
- Data visualization that tells stories, not just numbers

## Typography System

**Font Families** (via Google Fonts CDN):
- Primary: 'Inter' - Clean, highly legible for UI elements and data
- Display: 'Poppins' - Bold headings and dashboard titles
- Monospace: 'JetBrains Mono' - Statistics, attendance codes, IDs

**Type Scale**:
- Hero/Dashboard Title: text-4xl (Poppins, font-bold)
- Section Headers: text-2xl (Poppins, font-semibold)
- Card Titles: text-lg (Inter, font-semibold)
- Body Text: text-base (Inter, font-normal)
- Secondary/Meta: text-sm (Inter, font-medium)
- Captions/Labels: text-xs (Inter, font-normal)

## Layout System

**Spacing Primitives**: Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (between related items): 2, 4
- Component internal spacing: 6, 8
- Section spacing: 12, 16, 20
- Page margins: 20, 24

**Grid System**:
- Dashboard: 12-column grid with gap-6
- Cards: 1 column (mobile), 2-3 columns (tablet), 3-4 columns (desktop)
- Tables: Full-width with horizontal scroll on mobile
- Forms: Single column (mobile), 2-column (desktop) for related fields

## Dashboard Visual Architecture

**Layout Structure**:
- Sidebar Navigation: Fixed, 280px width (desktop), collapsible to icons (tablet), bottom nav (mobile)
- Main Content: max-w-7xl with px-6 py-8 spacing
- Top Bar: Breadcrumbs, search, notifications, profile (h-16)
- Content Cards: Glassmorphism effect with backdrop-blur

**Card Design Pattern** (Vision UI Inspired):
- Semi-transparent backgrounds with gradient overlays
- Backdrop blur: backdrop-blur-xl
- Borders: 1px subtle gradient borders
- Border radius: rounded-2xl for cards, rounded-xl for nested elements
- Shadows: Multi-layered shadows for depth (shadow-lg, shadow-[custom])
- Padding: p-6 (mobile), p-8 (desktop)

**Dashboard Sections**:

1. **Statistics Overview (Hero Section)**:
   - 4 stat cards in grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
   - Each card: Icon (top-left), Value (large, center), Label (bottom), Trend indicator
   - Gradient backgrounds per metric type (attendance rate, total students, active classes, today's absences)

2. **Real-Time Attendance Monitor**:
   - Large card spanning 2/3 width
   - Live updating list of current period attendance
   - Class photos displayed in grid
   - Status badges: Present (green), Absent (red), Late (yellow), Excused (blue)

3. **Weekly Overview Chart**:
   - Full-width card
   - Line/Bar chart showing attendance trends
   - Interactive hover states with detailed tooltips
   - Gradient fill under lines

4. **Recent Activity Feed**:
   - 1/3 width sidebar card
   - Timeline design with connecting lines
   - User avatars, timestamps, action descriptions
   - Infinite scroll or pagination

## Component Library

**Navigation (Sidebar)**:
- Logo area: h-20 with school emblem and name
- Menu items: py-3 px-4, with icon (left), label, badge (optional, right)
- Active state: Gradient background, increased opacity
- Hover: Subtle background change
- Dividers between sections

**Data Tables**:
- Header: Sticky, semi-transparent background, font-semibold
- Rows: Striped (subtle), hover state with background change
- Cells: py-4 px-6 with proper text alignment
- Actions column: Icon buttons with tooltips
- Pagination: Bottom-center with page numbers and prev/next

**Forms (User Management, Attendance)**:
- Labels: text-sm, font-medium, mb-2
- Inputs: Consistent h-12, px-4, rounded-lg
- Focus states: Ring with accent color
- Error states: Red ring, helper text below
- Success states: Green ring
- Phone input: Flag selector + number field

**Buttons**:
- Primary: Gradient backgrounds, rounded-lg, px-6 py-3
- Secondary: Outlined with border-2, transparent background
- Ghost: No border, minimal background on hover
- Icon buttons: Square (40x40), rounded-full for avatars
- Floating action button (FAB): Fixed bottom-right for quick actions

**Modal Dialogs**:
- Overlay: Semi-transparent dark (backdrop blur)
- Content: Centered card, max-w-2xl
- Header: Title, close button (top-right)
- Body: Scrollable if needed
- Footer: Actions (right-aligned), cancel (left)

**Cards & Containers**:
- Info Cards: Icon + Title + Value + Description layout
- Student Cards: Photo (top), Name, ID, Attendance %, Quick actions
- Class Cards: Class name, Teacher, Student count, Today's attendance
- Profile Cards: Avatar (large), Name, Role, Contact info

**Badges & Tags**:
- Status badges: Pill shape (rounded-full), px-3 py-1, text-xs
- Role tags: Rectangular (rounded), border, minimal background
- Count indicators: Circle, absolute positioning for notifications

**Charts & Visualizations**:
- Use Chart.js or ApexCharts libraries
- Gradient fills for area charts
- Rounded bars for bar charts
- Interactive tooltips with detailed info
- Legend: Positioned based on chart type
- Responsive sizing with aspect ratio maintenance

## Attendance Capture Interface

**Photo Display Grid**:
- Masonry layout for multiple class photos
- Thumbnail size: 150x150 (mobile), 200x200 (desktop)
- Lightbox on click for full view
- Timestamp and uploader info overlay
- Download option per photo

**Student Selection Grid**:
- Grid of student cards (3 columns mobile, 5-6 desktop)
- Each card: Avatar, Name, Status toggle
- Quick actions: Mark present, absent, late, excused with single tap
- Batch selection with checkboxes (optional)
- Search and filter bar above grid

## Login & Authentication Screens

**Login Page**:
- Split layout: 1/2 branding/illustration, 1/2 form (desktop)
- Stacked layout (mobile)
- Form: Phone number input, OTP verification flow
- Role selector: Radio buttons or dropdown
- "Forgot Password" link, minimal footer

**Registration Flow**:
- Multi-step wizard with progress indicator
- Steps: Personal info → Phone verification → Role assignment → Complete
- Back/Next navigation, step validation

## Reports & Analytics Pages

**Report Builder**:
- Filter panel (left sidebar or collapsible)
- Filters: Date range, Class, Student, Admin, Report type
- Main area: Generated report with export buttons (Excel, PDF)
- Visualization tabs: Chart view, Table view, Summary

**Statistics Dashboard**:
- KPI cards at top (attendance rate, trend vs last period)
- Charts grid: Attendance by class, by day, by period
- Leaderboard: Best attendance students/classes
- Comparison tables

## Mobile Responsive Patterns

- Hamburger menu for navigation (mobile)
- Bottom navigation bar for primary actions
- Swipeable cards and tabs
- Collapsible sections with chevron indicators
- Touch-friendly targets (min 44x44px)
- Simplified data tables with expandable rows

## Images & Photography

**Dashboard Hero Section**:
No traditional hero image. Opens directly with statistics cards and real-time data.

**Photo Integration Points**:
1. **Attendance Photos**: Captured during roll call, displayed in grids within attendance records
2. **Student Profiles**: Headshot photos in cards and lists
3. **Activity Feed**: Thumbnails of recent attendance photos
4. **Class Overview**: Representative class photo or collage
5. **Background Patterns**: Subtle geometric patterns or gradients, not photographic

**Placeholder Strategy**:
- Student without photo: Initials in colored circle
- Class without photo: Icon representation
- Loading states: Skeleton screens with shimmer effect

## Accessibility Considerations

- WCAG AA contrast ratios throughout
- Keyboard navigation for all interactive elements
- Screen reader labels for icons
- Focus indicators (ring-2 with accent color)
- Alt text for all images
- Semantic HTML structure
- Form field labels properly associated

## Animation & Interactions

**Micro-interactions** (minimal, purposeful):
- Button hover: Subtle scale (scale-105), brightness change
- Card hover: Lift effect (shadow increase, translate-y-1)
- Loading states: Pulse or spin for indicators
- Success/Error: Brief check/x icon animation
- Page transitions: Fade in content (0.2s ease)
- Chart animations: Staggered entrance (0.3s)

**Avoid**: Excessive parallax, continuous animations, distracting effects

## Dark/Light Mode Strategy

**Light Mode (Default)**:
- Background: Light gray gradients
- Cards: White with subtle shadows
- Text: Dark gray hierarchy

**Dark Mode**:
- Background: Deep blue-gray gradients (Vision UI style)
- Cards: Semi-transparent with glassmorphism
- Text: White/light gray hierarchy
- Accent colors: More vibrant, glowing effects
- Emphasis on depth through layered shadows and blur

**Toggle**: Icon button in top navigation, persists preference

This design system creates a cohesive, modern educational platform that feels professional for administrators while remaining approachable for students and parents, with clear data presentation as the foundation.