# User Journey Flows

## Flow 1: Participant Upload (Sofia at 11:51 PM)

**Goal:** Submit creative work before deadline with absolute confidence

```mermaid
flowchart TD
    A[Enter Contest Code + Participant Code] --> B{Valid codes?}
    B -->|No| A
    B -->|Yes| C[View Contest & Categories]
    C --> D[Select Category]
    D --> E{First submission in contest?}
    E -->|Yes| F[Enter Personal Info + T/L/C Info]
    E -->|No| G[Auto-fill from previous]
    F --> H[Upload File]
    G --> H
    H --> I[Progress Bar + Timestamp Locks]
    I --> J{Upload successful?}
    J -->|No| K[Show Error + Retry Option]
    K --> H
    J -->|Yes| L[Processing Video...]
    L --> M[Preview Submission]
    M --> N{Grace period active?}
    N -->|Yes| O[Show countdown: Submit within X:XX to keep timestamp]
    N -->|No| P[Show: Your submission time will be now]
    O --> Q[Click Submit]
    P --> Q
    Q --> R[Confirmation Screen + Screenshot-worthy]
    R --> S{Edit before deadline?}
    S -->|Yes| T[Replace Submission]
    T --> H
    S -->|No| U[Done - Wait for Results]
```

**Key UX Moments:**
- Timestamp locks when upload STARTS (deadline fairness)
- Grace period countdown after upload completes
- Unmistakable confirmation with timestamp
- Can edit/replace until deadline

---

## Flow 2: Judge Review (Marcus's 45-Minute Session)

**Goal:** Review all submissions efficiently with zero confusion

```mermaid
flowchart TD
    A[Receive Email Invite] --> B[Click Login Link]
    B --> C{Account exists?}
    C -->|No| D[Set Password]
    C -->|Yes| E[Enter Password]
    D --> F[Dashboard: Assigned Contests]
    E --> F
    F --> G[Select Contest]
    G --> H[View Assigned Categories + Progress]
    H --> I[Select Category to Review]
    I --> J[View Submission - Code Only, Anonymous]
    J --> K[View Media - Photo/Video]
    K --> L[Select Rating 1-5 Tier]
    L --> M[Write Feedback]
    M --> N[Save & Next]
    N --> O{More submissions?}
    O -->|Yes| J
    O -->|No| P[All Reviewed - Rank Top 3]
    P --> Q[Drag & Drop Ranking]
    Q --> R[Mark Category Complete]
    R --> S{More categories?}
    S -->|Yes| H
    S -->|No| T[All Done - Dashboard Shows Complete]
```

**Key UX Moments:**
- Progress always visible ("8 of 18 reviewed")
- One submission at a time (focused, not overwhelming)
- Arrow keys for quick navigation
- Satisfying completion state

---

## Flow 3: Admin Contest Creation (Jeb Setting Up)

**Goal:** Create fully-configured contest efficiently

```mermaid
flowchart TD
    A[Dashboard: Click New Contest] --> B[Enter Contest Details]
    B --> C[Name, Description, Contest Code, Rules]
    C --> D[Add Categories]
    D --> E[Category: Name, Type Photo/Video, Deadline, Rules]
    E --> F{More categories?}
    F -->|Yes| D
    F -->|No| G[Assign Judges to Categories]
    G --> H[Enter Judge Email per Category]
    H --> I{More judges?}
    I -->|Yes| H
    I -->|No| J[Review Contest Summary]
    J --> K[Save as Draft]
    K --> L{Ready to publish?}
    L -->|No| M[Edit Later from Dashboard]
    L -->|Yes| N[Publish Contest]
    N --> O[Confirmation: Contest Live]
    O --> P{Need participant codes?}
    P -->|Yes| Q[Click 'Generate Codes' Button]
    Q --> R[System Generates 50 Participant Codes]
    R --> S[View/Export Code List]
    P -->|Later| T[Generate Codes When Ready]
```

**Key UX Moments:**
- Clear step progression
- Codes generated on-demand via "Generate Codes" button (not automatic)
- Contest can exist with 0 codes initially
- Can save draft and return
- Generate more codes anytime as needed

---

## Flow 4: Admin Dashboard (Jeb Checking Status)

**Goal:** Answer "How are my contests doing?" in one glance

```mermaid
flowchart TD
    A[Login] --> B[Dashboard: All Contests Overview]
    B --> C{What to check?}
    C -->|Contest Status| D[Contest Cards with Status Badges]
    D --> E[See: Draft/Published/Closed/Reviewed/Finished]
    C -->|Submissions| F[Submission Counts per Category]
    F --> G[See: 45 of 50 codes used]
    C -->|Judge Progress| H[Judge Progress Bars]
    H --> I[See: 12/20 reviewed per category]
    C -->|Drill Down| J[Click Contest for Details]
    J --> K[Contest Detail View]
    K --> L{Action needed?}
    L -->|Override Judge| M[View Submission + Edit Feedback/Ranking]
    L -->|Generate Codes| N[Generate 50 More Codes]
    L -->|Change Status| O[Advance Contest Lifecycle]
    L -->|View Winners| P[Generate Winners Page]
    M --> K
    N --> K
    O --> K
    P --> Q[Set Password + Get URL]
```

**Key UX Moments:**
- Dashboard answers questions without clicking
- Status badges immediately scannable
- Progress bars show judge status at a glance
- Drill-down for actions, not just viewing

---

## Journey Patterns

**Common patterns across all flows:**

| Pattern | Implementation |
|---------|---------------|
| **Entry clarity** | Every flow starts with obvious entry point and clear first action |
| **Progress visibility** | Users always know where they are and what's left |
| **Confirmation explicitness** | Actions that matter get explicit confirmation ("Submitted at 11:51 PM") |
| **Error recovery** | Every failure state has a clear recovery path |
| **Exit clarity** | Users know when they're done and what happens next |

## Flow Optimization Principles

1. **Minimize clicks to value** — Sofia uploads in 4 steps, not 10
2. **Show don't tell** — Progress bars over text descriptions
3. **Smart defaults** — Auto-fill participant info, auto-generate codes
4. **Contextual actions** — Show only relevant actions for current state
5. **Batch operations** — Jeb generates 50 codes at once, not one by one
