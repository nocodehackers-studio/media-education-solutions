# Defining Experience

## The Core Moment

**"Upload and be certain"**

The participant upload experience is the defining interaction for Media Education Solutions. This is the highest-stakes moment — Sofia at 11:59 PM, racing the deadline, needing absolute confidence that her work is safe.

If we nail this moment, everything else follows:
- Participants trust the platform
- Jeb doesn't get "did my upload work?" emails
- The product earns word-of-mouth recommendations

## User Mental Model

**What participants expect:**
- Progress that feels real (not fake progress bars)
- Clear feedback at every stage
- Ability to preview before final submit
- Unmistakable confirmation when done
- Graceful handling if something goes wrong

**Current frustrations with uploads:**
- Vague progress indicators
- No idea if it's working or frozen
- Unclear error messages when something fails
- Anxiety about whether it actually went through

## Success Criteria

| Criteria | Target |
|----------|--------|
| **Confidence** | User never wonders "is it working?" |
| **Progress clarity** | Percentage + speed + time remaining visible |
| **Deadline fairness** | Timestamp captured at upload START, not completion |
| **Completion certainty** | Unmistakable confirmation with timestamp |
| **Verification** | Preview before final submit |

## Submission Timestamp Logic (CRITICAL)

To protect participants with slow connections during deadline crunch:

| Event | Timestamp Behavior |
|-------|-------------------|
| Upload starts at 11:59 PM | Timestamp **locks** at 11:59 PM |
| Upload completes at 12:03 AM | Grace period begins (10-15 minutes) |
| Submit clicked within grace period | Submission time = **11:59 PM** (protected) |
| Submit clicked after grace period expires | Submission time = **actual click time** (late) |

**UX Implications:**
- Show locked timestamp prominently during upload: "Your submission time: 11:59 PM"
- After upload completes, show countdown: "Submit within 14:32 to keep your 11:59 PM timestamp"
- If grace period expires, update messaging: "Your submission time will be when you click Submit"

## Experience Mechanics

**Stage 1: Initiation**
- Generous drag-and-drop zone (not a tiny button)
- File specs visible: "Up to 500MB • MP4, MOV, WebM"
- Instant validation before upload begins (format, size)
- Click-to-browse as fallback

**Stage 2: Upload Progress**
- **Timestamp locks when upload starts** — display prominently
- Smooth progress bar (no jumps or freezes)
- Real metrics: "67% • 2.3 MB/s • ~45 seconds remaining"
- Connection quality indicator
- Cancel option always visible

**Stage 3: Processing**
- "Processing video..." state after upload completes
- Explain what's happening: "Preparing your video for playback..."
- Show processing progress if available from Bunny
- Grace period countdown begins

**Stage 4: Preview**
- Thumbnail generated and displayed
- Play button to verify correct file
- File details visible (duration, size)
- Grace period countdown visible: "Submit within 12:45 to lock your 11:59 PM time"

**Stage 5: Confirmation**
- Big submit button: "Submit to [Category Name]"
- Post-submit confirmation screen:
  - Green checkmark, unmistakable success
  - "Submitted at 11:59 PM — before the 12:00 AM deadline"
  - Submission reference code
  - "You can edit until [deadline]" if applicable
  - Screenshot-worthy for Sofia to send to her coach

**Error Handling**
- Connection slow: "Upload continuing... connection is slow but stable"
- Connection lost: "Connection interrupted. [Try again]" (resumable upload if Bunny supports it — verify during implementation)
- File rejected: Specific reason + what to do ("File is 520MB. Maximum is 500MB. [Choose different file]")
- Server error: "Something went wrong on our end. [Try again] — your file is safe locally"

## Pattern Classification

**Established patterns we're using:**
- Drag-and-drop upload (Dropbox, Google Drive)
- Progress bar with real metrics (WeTransfer)
- Preview before submit (YouTube)
- Confirmation with timestamp (form submissions)

**Our refinements:**
- Timestamp locks at upload START (deadline fairness)
- Grace period with visible countdown
- "Deadline-aware" messaging throughout
- Screenshot-worthy confirmation (Sofia texts her coach)

**Implementation Notes:**
- Resumable uploads: Verify if Bunny supports this; if not, design graceful retry
- Grace period duration: Recommend 10-15 minutes, confirm with Jeb
