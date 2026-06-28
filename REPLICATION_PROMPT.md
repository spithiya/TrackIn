# BrightMind — Full Software Replication Prompt

Use this document to replicate BrightMind in its entirety. It describes every feature, screen, data model, business rule, and technical decision.

---

## What BrightMind Is

BrightMind is a **tutoring center CRM and check-in system** for a business with one or more physical locations. It tracks student sessions, staff clock-in/out, parent contact information, session notes, and produces analytics. It is a multi-tenant SaaS product scoped to organizations (called "orgs"). Each org has locations, staff members, and students.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Backend / Auth / DB | Supabase (PostgreSQL + Row-Level Security + Realtime) |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| SMS | Twilio |
| Excel export | SheetJS (`xlsx`) |
| PDF export | jsPDF + jspdf-autotable |
| Icons | lucide-react |

---

## Database Schema

### Tables

**`organizations`**
- `id` uuid PK
- `name` text
- `created_at` timestamptz

**`locations`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `name` text
- `address_street`, `address_city`, `address_state`, `address_zip` text (all required)
- `phone` text (optional)
- `notes` text (optional)
- `opens_at` time (default 08:00)
- `closes_at` time (default 18:00)
- `is_active` boolean (default true)
- `created_at` timestamptz

**`profiles`**
- `id` uuid PK references `auth.users`
- `org_id` uuid FK → organizations
- `role` text: `'owner'` or `'staff'`
- `full_name` text
- `email` text
- `created_at` timestamptz

**`staff_members`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `profile_id` uuid FK → profiles (nullable — staff can exist without a login)
- `first_name`, `last_name` text (required)
- `dob` date (optional)
- `phone`, `email` text (optional)
- `role_title` text (optional, e.g. "Math Tutor")
- `location_id` uuid FK → locations (primary location)
- `location_ids` uuid[] (optional extra locations)
- `subjects` text: `'math'` | `'reading'` | `'both'`
- `is_active` boolean (default true)
- `created_at` timestamptz

**`students`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `first_name`, `last_name` text (required)
- `dob` date (optional)
- `subjects` text: `'math'` | `'reading'` | `'both'`
- `location_id` uuid FK → locations
- `notes` text (optional — shown as a warning banner during staff check-in)
- `is_active` boolean (default true)
- `created_at` timestamptz

**`parent_contacts`**
- `id` uuid PK
- `student_id` uuid FK → students (cascade delete)
- `org_id` uuid FK → organizations
- `full_name` text
- `relationship` text: `'Mother'` | `'Father'` | `'Guardian'` | `'Other'`
- `phone` text (optional)
- `email` text (optional)
- `is_primary` boolean (default false) — only one per student should be true
- `created_at` timestamptz

**`student_checkins`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `student_id` uuid FK → students
- `location_id` uuid FK → locations
- `checked_in_at` timestamptz (default now())
- `checked_out_at` timestamptz (null while active)
- `subjects_snapshot` text: `'math'` | `'reading'` | `'both'` (captured at time of check-in; may differ if student profile is later edited)
- `time_limit_minutes` int (30 for single subject, 60 for both)
- `checkin_method` text: `'kiosk'` | `'staff'`
- `assigned_staff_id` uuid FK → staff_members (optional)
- `checked_in_by_staff_id` uuid FK → staff_members (optional)
- `checked_out_by_staff_id` uuid FK → staff_members (optional)
- `sms_sent` boolean (default false — set true when checkout triggers SMS)
- `session_note` text (optional, added at checkout)
- `duration_minutes` int (computed and stored at checkout)
- `created_at` timestamptz

**`staff_checkins`** (timesheet records)
- `id` uuid PK
- `org_id` uuid FK → organizations
- `staff_id` uuid FK → staff_members
- `location_id` uuid FK → locations
- `checked_in_at` timestamptz
- `checked_out_at` timestamptz (null while clocked in)
- `duration_minutes` int (computed at clock-out)
- `checked_out_by_owner` boolean (tracks if owner forced the clock-out)
- `created_at` timestamptz

**`session_alerts`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `checkin_id` uuid FK → student_checkins
- `student_id` uuid FK → students
- `assigned_staff_id` uuid FK → staff_members (nullable)
- `message` text
- `acknowledged_by` uuid FK → staff_members (nullable)
- `acknowledged_at` timestamptz
- `created_at` timestamptz

**`staff_notifications`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `staff_id` uuid FK → staff_members
- `location_id` uuid FK → locations
- `type` text: `'clock_in'` | `'clock_out'`
- `timestamp` timestamptz
- `dismissed` boolean
- `created_at` timestamptz

**`sms_log`**
- `id` uuid PK
- `org_id` uuid FK → organizations
- `checkin_id` uuid FK → student_checkins
- `to_phone` text
- `message` text
- `twilio_sid` text
- `status` text (default `'sent'`)
- `created_at` timestamptz

### Views

**`active_students`** — joins `student_checkins` + `students` + `staff_members` where `checked_out_at IS NULL`. Computes:
- `elapsed_minutes` (integer minutes since check-in)
- `timer_status`: `'green'` | `'yellow'` | `'red'`
  - For **both** subjects: yellow ≥ 30 min, red ≥ 60 min
  - For **single** subject: yellow ≥ 15 min, red ≥ 30 min
- `assigned_staff_name` (concatenated full name or null)

**`active_staff`** — joins `staff_checkins` + `staff_members` where `checked_out_at IS NULL`. Computes `elapsed_minutes`.

**`visit_history`** — joins `student_checkins` + `students` + `staff_members` where `checked_out_at IS NOT NULL`. Used for the history table and analytics.

### Database Functions

**`checkout_student(checkin_id uuid, session_note text DEFAULT null)`** (security definer)
- Verifies the checkin exists and is not already checked out
- Computes `duration_minutes`
- Sets `checked_out_at`, `duration_minutes`, `session_note`, and `sms_sent = true` if over the time limit
- Closes all unacknowledged `session_alerts` for that checkin
- Returns JSON: `{ send_sms: bool, parent_phone: text|null, student_first_name: text }`
- The caller (client or API route) decides whether to fire the SMS based on the return value

**`checkout_staff(p_checkin_id uuid, p_by_owner boolean DEFAULT false)`** (security definer)
- Verifies the staff checkin exists and is active
- Sets `checked_out_at`, `duration_minutes`, `checked_out_by_owner`
- Inserts a `staff_notifications` row with type `'clock_out'`
- Returns JSON: `{ duration_minutes: int }`

### Row-Level Security

- All tables have RLS enabled.
- A helper function `auth_org_id()` reads the current user's `profiles.org_id`.
- Every authenticated table has a policy: `org_id = auth_org_id()` for both SELECT and INSERT/UPDATE.
- **Kiosk exception**: anonymous users can `SELECT` from `students` and `INSERT`/`UPDATE` on `student_checkins` where `checked_out_at IS NULL`. This powers the public-facing kiosk without requiring login.

### Realtime

Tables subscribed: `student_checkins`, `staff_checkins`, `session_alerts`, `staff_notifications`.

---

## Time Limit / Timer Business Rules

| Subject | Session Limit | Yellow Warning | Red Alert |
|---|---|---|---|
| Math only | 30 min | 15 min | 30 min |
| Reading only | 30 min | 15 min | 30 min |
| Math + Reading | 60 min | 30 min | 60 min |

- `time_limit_minutes` is stored on `student_checkins` at check-in time using `subjects_snapshot`.
- The `timer_status` is computed live in the `active_students` view using database `now()`.
- When a student is checked out and their elapsed time ≥ `time_limit_minutes`, `sms_sent` is marked true and the checkout function returns `send_sms: true`. The client then calls the SMS API route.
- There is a 15-minute **closing warning** constant (`CLOSING_WARNING_MINUTES = 15`).
- The kiosk resets to idle 3 seconds after a successful check-in/out (`KIOSK_RESET_DELAY_MS = 3000`).

---

## Application Routes

### Public Routes
- `/` — Home page with buttons to enter the Owner Portal or Staff Portal
- `/auth/login` — Email/password login form (Supabase Auth)
- `/auth/callback` — OAuth callback handler
- `/kiosk` — Location picker (lists all active locations)
- `/kiosk/[locationId]` — The self-service kiosk for a specific location

### Owner Portal (`/owner/*`) — requires auth + `role = 'owner'`
- `/owner/dashboard` — redirect to analytics (or a summary)
- `/owner/live` — real-time view of active students and staff
- `/owner/checkin` — manual check-in/out for students and staff clock-in/out
- `/owner/students` — student list with search and filters
- `/owner/students/new` — add a new student form
- `/owner/students/[id]` — student detail: edit info, manage contacts, view recent sessions
- `/owner/staff` — staff roster with search
- `/owner/staff/new` — register a new staff member
- `/owner/staff/[id]` — staff detail: edit info, set locations, delete
- `/owner/locations` — manage locations (add/edit/delete)
- `/owner/analytics` — analytics dashboard (charts)
- `/owner/history` — visit history table with filters and CSV export
- `/owner/timesheets` — staff timesheet table with filters and CSV/Excel/PDF export

### Staff Portal (`/staff/*`) — requires auth + `role = 'staff'`
- `/staff/dashboard` — view currently active students and staff on duty
- `/staff/checkin` — check in students (staff-side flow)
- `/staff/my-checkin` — view and manage own clock-in/out
- `/staff/my-timesheet` — personal timesheet history

### API Routes
- `POST /api/sms/send` — sends a Twilio SMS to a parent and logs it in `sms_log`. Body: `{ to, studentName, centerName, checkinId, orgId }`
- `GET /api/export/csv` — exports `visit_history` as a CSV download
- `GET /api/export/sheets` — (legacy) Google Sheets export stub

---

## Feature Details

### Kiosk (`/kiosk/[locationId]`)
- Unauthenticated public screen — no login required
- Shows a location badge (location name) and a "Welcome!" heading
- Auto-focuses a search input. Students type their name; client-side filtering filters the pre-loaded student list for that org
- Each result shows the student's full name, subject tags, and an "In"/"Out" pill showing current check-in status
- Clicking a student triggers a Supabase query to check if they have an active checkin:
  - If **not checked in**: shows a confirmation card with name, subjects, and session time limit → confirm check-in → inserts a `student_checkins` row with `checkin_method = 'kiosk'`
  - If **checked in**: shows elapsed timer, subjects, and check-in time → confirm check-out → calls `checkout_student` RPC → if SMS required, fires `/api/sms/send`
- After success, shows a large success screen ("You're checked in!" or "See you next time!") then auto-resets after 3 seconds
- Keyboard: Enter key confirms pending check-in or check-out
- Checked-in status is refreshed every 30 seconds
- A "Back to Top" button appears when the list is scrolled more than 100px
- A location-picker page at `/kiosk` lists all active locations as cards; clicking one navigates to that location's kiosk

### Owner: Live Display (`/owner/live`)
- Two-column card layout: Active Students (left) and Active Staff (right)
- Each card shows a count badge and a scrollable list
- Students show name, subject tags, and a live TimerPill (color-coded green/yellow/red)
- Staff show name, clock-in time, and elapsed minutes
- Uses Supabase Realtime subscriptions via `useActiveStudents` and `useActiveStaff` hooks; updates in real time without page refresh
- A pulsing green dot indicates real-time connection

### Owner: Check In / Out (`/owner/checkin`)
- Tabbed interface: "Students" tab and "Staff" tab
- **Students tab**:
  - Search bar with 300ms debounce; queries `students` by name (`ilike`) when ≥ 2 characters
  - Clicking a result opens a modal:
    - Shows student name and any `notes` as an amber warning banner
    - Subject selector (Math 30 min / Reading 30 min / Math + Reading 60 min)
    - Optional "Assign to Staff" dropdown showing currently clocked-in staff
    - Confirm button inserts a `student_checkins` row with `checkin_method = 'staff'`
  - "Currently Checked In" section lists all active students (sorted by check-in time ascending)
  - Each row shows name, subject tags, assigned staff name, check-in time, timer pill, and a "Check Out" button
  - Clicking "Check Out" opens a modal with the timer pill, check-in time, and an optional session note textarea; calls `checkout_student` RPC
- **Staff tab**:
  - Lists all staff members for the org
  - Each row shows status ("Clocked In" / "Not In"), elapsed time if clocked in, and a Clock In / Clock Out button
  - Clock-in inserts a `staff_checkins` row; clock-out calls `checkout_staff` RPC with `by_owner = true`
  - Toast notifications confirm success/failure

### Owner: Student Records (`/owner/students`)
- Searchable, filterable, sortable table
- Filters: text search by name, subject dropdown (All / Math / Reading / Math+Reading)
- Sort: by Name (last, first) or Location; clicking column header toggles asc/desc
- Each row: last name + first name, subject tags, location name, Active/Inactive badge
- Clicking a row navigates to `/owner/students/[id]`
- "Add Student" button navigates to the add-student form

### Owner: Student Detail (`/owner/students/[id]`)
- **Student Information card**: view/edit name, DOB (shows calculated age), subjects (radio buttons), location (dropdown), notes (textarea)
  - Edit mode has unsaved-changes browser warning (`beforeunload`)
  - Actions: Mark as inactive/active toggle; Delete student (with two-step confirmation)
- **Parent/Guardian Contacts card**:
  - Lists all contacts with name, relationship badge, primary badge, phone (with one-click copy button), email
  - "Set primary" button on non-primary contacts (updates all contacts for that student)
  - Delete contact button
  - "Add contact" inline form: full name (required), relationship dropdown (Mother/Father/Guardian/Other), phone, email
- **Recent Sessions card** (shown only if sessions exist):
  - Last 5 completed sessions: date, session note in italics, subject tags, duration

### Owner: Staff Dashboard (`/owner/staff`)
- Similar table to students: search by name or email, sort by Name or Location
- Columns: Name + email sub-row, Role title, Subjects, Location, Active/Inactive badge
- Clicking a row navigates to `/owner/staff/[id]`
- "Register Staff" button navigates to registration form

### Owner: Register Staff (`/owner/staff/new`)
- Form fields: First Name*, Last Name*, Email, Phone, Date of Birth, Role Title, Subjects* (radio), Location* (dropdown)
- On submit: inserts into `staff_members` with `is_active = true`, `profile_id = null`
- Note: staff members can exist without a Supabase Auth login (they are tracked as records only)

### Owner: Staff Detail (`/owner/staff/[id]`)
- View/edit all staff fields: name, role title, phone, email, DOB, subjects, primary location, additional locations (checkboxes for all other org locations)
- Delete staff member (two-step confirmation)
- No timesheet shown here — timesheets are in the separate timesheets page

### Owner: Locations (`/owner/locations`)
- Grid of location cards showing name, active status, address, phone, hours
- "Add Location" / "Edit" / "Delete" via modals
- Location form fields: name*, street*, city*, state* (2-char), zip*, phone, opens_at* (time), closes_at* (time), notes, is_active (checkbox in edit mode)
- Delete requires confirmation modal; uses server actions

### Owner: Analytics (`/owner/analytics`)
- Date range toggle: 7d / 30d / 90d (compares current period vs. prior equal period)
- **Summary metric cards** (3):
  - Total Visits (with % trend vs. prior period)
  - Avg Session duration in minutes (with % trend)
  - Top Subject (no trend)
- **Visits bar chart**: daily bars for 7d, weekly buckets for 30d/90d
- **Peak Hours bar chart**: hourly counts from 7am–9pm (15 bars)
- **Subjects Breakdown pie/donut chart**: Math (teal), Reading (indigo), Math+Reading (amber)
- **Session Duration histogram**: 4 buckets (0–30m, 31–60m, 61–90m, 90m+)
- **Check-in Method bar**: horizontal progress bar showing Kiosk % vs. Staff %

### Owner: Visit History (`/owner/history`)
- Filterable table showing completed sessions (last 100 by default)
- Filters: location dropdown, date range (from/to date pickers), clear button
- Columns: Student name, Date, In time, Out time, Duration (monospaced), Subjects, Method (Kiosk/Staff badge)
- "Export CSV" button: opens `/api/export/csv?locationId=...` in a new tab

### Owner: Timesheets (`/owner/timesheets`)
- Filterable table showing completed staff clock-in/out records
- Filters: staff dropdown, location dropdown, date range
- Columns: Staff name + role sub-row, Location, Date, Clock In time, Clock Out time, Duration (monospaced)
- **Download dropdown** (three formats):
  - CSV: client-side Blob download
  - Excel (.xlsx): uses SheetJS `aoa_to_sheet` / `writeFile`
  - PDF (landscape): uses jsPDF + autoTable with teal header row
- Dropdown closes when clicking outside (click-outside listener via `useRef`)

### Staff Portal: Dashboard (`/staff/dashboard`)
- Two metric cards: Students In (green if any, red if any are over time limit), Staff In (green if any)
- Active Students list: name, subject tags, assigned staff name, check-in time, timer pill
- Staff On Duty list: name, clock-in time
- Uses same `useActiveStudents` / `useActiveStaff` hooks as owner live display

### Staff Portal: My Check-In (`/staff/my-checkin`)
- Staff member can clock themselves in/out (inserts/calls `checkout_staff` with `by_owner = false`)

### Staff Portal: My Timesheet (`/staff/my-timesheet`)
- Personal clock-in/out history filtered to the logged-in staff member

---

## Shared Components

### TimerPill
- Displays elapsed time (e.g. "24m") in a color-coded pill
- Color driven by `timer_status` from the active_students view or computed client-side:
  - Green: within limits
  - Yellow: past first threshold
  - Red: at or past time limit
- Updates in real time on the owner dashboard via Supabase Realtime

### SubjectTags
- Renders colored badges for `'math'` | `'reading'` | `'both'`
- Math: teal; Reading: indigo; Both: amber

### LocationFilterDropdown
- Global filter in the owner layout nav; lets owners scope all pages to one or more specific locations

### Hooks
- `useActiveStudents(orgId, locationIds)` — subscribes to Supabase Realtime on `student_checkins` + `session_alerts`, fetches from `active_students` view, returns live list + loading state + `refetch()`
- `useActiveStaff(orgId, locationIds)` — same pattern for `active_staff` view, subscribes to `staff_checkins` + `staff_notifications`
- `useCurrentUser()` — fetches the authenticated user and their profile (role, org_id)
- `useLocationFilter()` — reads/writes location filter state from URL params or local state
- `useTimerStatus(checkedInAt, subjects)` — computes green/yellow/red client-side with a 1-minute interval tick
- `useClosingWarning(closesAt)` — returns true if within CLOSING_WARNING_MINUTES of location close time

---

## Auth & Access Control

- Supabase Auth (email + password). Sessions stored in cookies via `@supabase/ssr`.
- Middleware (`middleware.ts`):
  - `/kiosk/*` — always allowed (no auth check)
  - `/owner/*` — redirect to `/auth/login` if not authenticated
- Owner layout (server component): reads `profile.role`, redirects staff users away from owner routes
- Staff layout: similar check, redirects owners to owner portal
- RLS enforces data isolation at the database level regardless of UI routing

---

## SMS Integration (Twilio)

- When a student is checked out and their session was over the time limit, the checkout function returns `send_sms: true` plus the primary parent's phone number.
- The client calls `POST /api/sms/send` with `{ to, studentName, centerName, checkinId, orgId }`.
- The API route calls `sendPickupSMS(to, studentName, centerName)` from `@/lib/twilio`, then logs the result to `sms_log`.
- The SMS message text is: e.g. "Hi! [StudentName] has finished their session at BrightMind and is ready for pickup."

---

## Data Export

- **CSV (visit history)**: server-side API route at `/api/export/csv` — queries `visit_history` view with optional location filter, returns `text/csv` with headers: Student, Date, In, Out, Duration (min), Subjects, Method, Note
- **Timesheets CSV**: client-side Blob construction from in-memory table data
- **Timesheets Excel**: SheetJS `aoa_to_sheet` with header row + data rows → `timesheets.xlsx`
- **Timesheets PDF**: jsPDF (landscape) + autoTable with teal header fill → `timesheets.pdf`

---

## Design System

- Color palette: teal (primary actions, `#0D9488`), slate (text/UI), indigo (reading subject, `#534AB7`), amber (both-subject warnings, `#F59E0B`), red (over time / danger), green (active / success)
- Rounded corners: `rounded-lg` (12px) on inputs and cards, `rounded-xl` (16px) on larger containers
- Cards: white bg, `border border-slate-200`, subtle shadow
- Badges: small pill components with `variant` prop: `'teal'` | `'green'` | `'gray'` | `'default'`
- Buttons: `variant` prop: `'primary'` (teal fill) | `'secondary'` (slate outline) | `'outline'` | `'ghost'` | `'danger'` (red); `size`: `'sm'` | `'md'` | `'xl'`
- Toast notifications: fixed bottom-right, auto-dismiss, `variant`: `'green'` | `'amber'` | `'red'`
- Modal: overlay with white centered panel, title bar, close button, click-outside to close
- Input: text input with optional clear (X) button that appears when the field has a value
- All forms use Tailwind `focus:ring-2 focus:ring-teal-500` for focus states
- Font: system default via Tailwind's `font-sans`; monospace font used for times/durations

---

## Key Business Constants

```
TIME_LIMITS = { single: 30, both: 60 }   // minutes
TIMER_THRESHOLDS = {
  single: { yellow: 15, red: 30 },
  both:   { yellow: 30, red: 60 }
}
CLOSING_WARNING_MINUTES = 15
KIOSK_RESET_DELAY_MS = 3000
```

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # for server-side admin operations
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
```
