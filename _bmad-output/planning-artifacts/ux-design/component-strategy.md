# Component Strategy

## Design System Components (shadcn/ui)

**Directly usable from shadcn/ui:**

| Category | Components |
|----------|------------|
| **Forms** | Button, Input, Textarea, Select, Checkbox, Form (with React Hook Form + Zod) |
| **Layout** | Card, Dialog, Sheet, Tabs, Separator |
| **Data Display** | Table, Badge, Progress, Avatar, Skeleton |
| **Feedback** | Toast, Alert, Tooltip |
| **Navigation** | Dropdown Menu, Navigation Menu |

All components used as-is with Untitled UI color tokens applied via Tailwind config.

## Custom Components

### `<UploadProgress>`
**Purpose:** The defining upload experience for participants
**Content:** File name, progress bar, percentage, upload speed, processing state
**States:** Idle, Uploading, Processing, Complete, Error
**Key Feature:** Smooth progress animation, clear error recovery

### `<RatingScale>`
**Purpose:** 5-tier judge rating selection
**Content:** Five labeled tiers (Developing Skills → Master Creator) with numeric ranges
**States:** Unselected, Hovered, Selected
**Key Feature:** Visual feedback on selection, keyboard accessible

### `<SubmissionCard>`
**Purpose:** Anonymous submission display for judges
**Content:** Participant code, media thumbnail, rating status, feedback preview
**States:** Unreviewed, In Progress, Reviewed
**Key Feature:** No PII visible — code only

### `<MediaViewer>`
**Purpose:** Full-screen photo/video display
**Content:** Photo or video with playback controls
**States:** Loading, Playing, Paused, Fullscreen, Error
**Key Feature:** Esc to exit, Spacebar play/pause, arrow keys for next/prev

### `<CodeListTable>`
**Purpose:** Participant code management for admin
**Content:** Code, status (Used/Unused), participant name if used
**States:** Default, Filtered, Exporting
**Key Feature:** Bulk export, status filtering

### `<ContestCard>`
**Purpose:** Dashboard overview card for each contest
**Content:** Contest name, status badge, submission count, judge progress
**States:** Draft, Published, Closed, Reviewed, Finished
**Key Feature:** Answers "how is this contest doing?" at a glance

### `<RankingDropzone>`
**Purpose:** Drag-and-drop top 3 ranking for judges
**Content:** Three numbered positions with submission cards
**States:** Empty, Partially filled, Complete
**Key Feature:** Drag to reorder, visual feedback on drop

## Component Implementation Strategy

**Build Order (by user journey criticality):**

| Priority | Component | Needed For |
|----------|-----------|------------|
| P0 | `<UploadProgress>` | Participant upload (defining experience) |
| P0 | `<RatingScale>` | Judge review flow |
| P0 | `<MediaViewer>` | Judge review flow |
| P1 | `<SubmissionCard>` | Judge review flow |
| P1 | `<ContestCard>` | Admin dashboard |
| P1 | `<RankingDropzone>` | Judge ranking |
| P2 | `<CodeListTable>` | Admin code management |

**Implementation Approach:**
- Build on top of shadcn/ui primitives where possible
- Use Tailwind for styling consistency
- Follow component library discipline (all variants in one file)
