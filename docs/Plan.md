# MeetingActions — Plan

## PRD — Product Requirements Document

### Vision

Turn any meeting recording or transcript into a clear, immediately actionable list of tasks, decisions, and follow-ups — organised per participant — so no action item gets lost after the meeting ends.

### Target Users

- Teams who run regular working meetings (projects, clients, planning)
- Meeting attendees who need a fast recap of "what do I do next?"
- Team leads who want to distribute task ownership after a meeting

### Goals

1. Reduce the time from "meeting ends" to "tasks are assigned" to under 2 minutes
2. Produce output clear enough to act on without reading the transcript
3. Surface per-participant ownership so follow-up is unambiguous

### Success Metrics

- A user can paste a transcript and receive structured tasks in < 10 seconds
- Output contains at least one owner-assigned task per participant (when speakers are identified)
- A test user can identify their next action without reading the full transcript

### Constraints

- AI inference via `AI_GATEWAY_API_KEY` (no direct model billing per user)
- No backend database — local/session state only for hackathon scope
- Must work on desktop browsers; mobile is a nice-to-have
- Audio transcription is a stretch goal after the text-input flow is stable

### Out of Scope (v1)

- User authentication / multi-tenant storage
- Calendar or task-manager integrations (Jira, Notion, etc.)
- Real-time meeting capture
- Mobile app

---

## FRD — Functional Requirements Document

### F-1 — Transcript Input

| ID | Requirement |
|---|---|
| F-1.1 | User can paste raw transcript text into a multi-line text area |
| F-1.2 | User can upload an audio file (mp3, mp4, wav, m4a, webm) via drag-and-drop or file picker |
| F-1.3 | When audio is uploaded, the app transcribes it server-side and populates the transcript text area |
| F-1.4 | Transcribed audio is cached by file hash to avoid redundant API calls |
| F-1.5 | A "clear" action resets both inputs |
| F-1.6 | Input validation: must have non-empty transcript to trigger analysis |

### F-2 — AI Analysis

| ID | Requirement |
|---|---|
| F-2.1 | A single "Analyse" action sends the transcript to the AI analysis endpoint |
| F-2.2 | The endpoint uses structured output (Zod schema) to return: tasks, decisions, follow-ups, and participants |
| F-2.3 | Each task has: `description`, `owner` (optional), `deadline` (optional), `priority` (high / medium / low) |
| F-2.4 | Each decision has: `description`, `rationale` (optional) |
| F-2.5 | Each follow-up has: `description`, `assignedTo` (optional) |
| F-2.6 | The endpoint streams the response so the UI can progressively render results |
| F-2.7 | If the transcript is ambiguous or sparse, the AI returns a `warnings` array with notes |

### F-3 — Output Display

| ID | Requirement |
|---|---|
| F-3.1 | Output is displayed in a structured layout: Tasks / Decisions / Follow-ups sections |
| F-3.2 | Each task renders with owner badge, priority indicator, and optional deadline |
| F-3.3 | The transcript and task summary are shown side-by-side on ≥ 1024 px screens |
| F-3.4 | On smaller screens, transcript and output are stacked with a tab/toggle switch |
| F-3.5 | Markdown in AI output is rendered progressively as the stream arrives |
| F-3.6 | A loading/streaming state is shown while the AI generates the response |
| F-3.7 | Warnings from F-2.7 are displayed as a dismissible notice |

### F-4 — Per-Participant View

| ID | Requirement |
|---|---|
| F-4.1 | When participant names are identified, a "By Participant" tab shows each person's tasks and follow-ups |
| F-4.2 | Each participant card shows their name, task count, and a list of their action items |
| F-4.3 | A "Copy my tasks" button copies the participant's items as plain text |
| F-4.4 | If no speakers are identified, an "Unassigned" bucket collects all tasks |

### F-5 — Transcript Cache

| ID | Requirement |
|---|---|
| F-5.1 | Uploaded audio files are hashed (SHA-256) before transcription is requested |
| F-5.2 | Transcription result is stored in a server-side in-memory Map keyed by hash |
| F-5.3 | On subsequent upload of the same file, the cached transcript is returned immediately |
| F-5.4 | Cache is per-process (in-memory); no persistence across server restarts required for v1 |

---

## Action Tasks — by Developer

### Dev A — Backend & AI Infrastructure

| Task | Description | FRD ref |
|---|---|---|
| A-1 | Install `ai`, `@ai-sdk/openai`, and `zod` packages | — |
| A-2 | Create `.env.local.example` documenting `AI_GATEWAY_API_KEY` and model base URL format | — |
| A-3 | Create `lib/schema.ts` — Zod schemas for `MeetingAnalysis` (tasks, decisions, follow-ups, participants, warnings) | F-2.2–F-2.7 |
| A-4 | Create `app/api/analyze/route.ts` — POST handler: receives `{ transcript }`, calls `streamObject` with Zod schema, streams result back | F-2.1–F-2.7 |
| A-5 | Create `lib/cache.ts` — SHA-256 hash helper + in-memory Map for transcript caching | F-5.1–F-5.4 |
| A-6 | Create `app/api/transcribe/route.ts` — POST handler: receives audio file, checks cache, calls AI transcription, returns `{ transcript, cached }` | F-1.3–F-1.4 |
| A-7 | Smoke-test both API routes with sample payloads | — |

*Can start immediately. Blocks C-4 (needs A-4) and B-4 (needs A-6).*

---

### Dev B — Transcript Input UI

| Task | Description | FRD ref |
|---|---|---|
| B-1 | Create `components/transcript-input.tsx` — controlled text area with character count and "Clear" button | F-1.1, F-1.5 |
| B-2 | Add file-upload zone: drag-and-drop + file picker, accept filter for audio types | F-1.2 |
| B-3 | Wire upload to `POST /api/transcribe` — show spinner while transcribing, populate text area on success | F-1.3 |
| B-4 | Add input validation: disable "Analyse" if transcript is empty; show inline error on submit attempt | F-1.6 |
| B-5 | Replace `app/page.tsx` placeholder with two-panel shell layout (transcript left, output right) | F-3.3 |
| B-6 | Add "Load demo" shortcut that inserts a sample transcript for fast prompt iteration | — |

*B-1, B-2, B-5 can start immediately. B-3 depends on A-6.*

---

### Dev C — Task Output Rendering

| Task | Description | FRD ref |
|---|---|---|
| C-1 | Re-export TypeScript types from `lib/schema.ts` into `lib/types.ts` for use across components | — |
| C-2 | Create `components/task-card.tsx` — single task item: description, owner badge, priority colour chip, optional deadline | F-3.2 |
| C-3 | Create `components/task-output.tsx` — Tasks / Decisions / Follow-ups sections; accepts `MeetingAnalysis` prop | F-3.1 |
| C-4 | Add streaming fetch in `app/page.tsx`: call `POST /api/analyze`, update state progressively as stream arrives | F-2.6, F-3.6 |
| C-5 | Add loading skeleton shown during streaming | F-3.6 |
| C-6 | Render dismissible warnings banner when `warnings` is non-empty | F-3.7 |
| C-7 | Implement responsive layout: side-by-side ≥ 1024 px, stacked + tabs below | F-3.3, F-3.4 |

*C-1 depends on A-3. C-4 depends on A-4. C-2, C-3, C-5, C-6 can be built with mock data first.*

---

### Dev D — Per-Participant View + Polish

| Task | Description | FRD ref |
|---|---|---|
| D-1 | Create `components/participant-tasks.tsx` — card per identified participant, task/follow-up list | F-4.1–F-4.2 |
| D-2 | Add "By Participant" tab alongside the global summary tab in task output | F-4.1 |
| D-3 | Implement "Copy my tasks" clipboard action per participant card | F-4.3 |
| D-4 | Add "Unassigned" fallback bucket when `owner` is null | F-4.4 |
| D-5 | Apply consistent visual polish: spacing, typography scale, dark mode verification, priority colour system | — |
| D-6 | Update `README.md`: local dev setup, `.env.local` instructions, how to run | — |

*D-1 depends on A-3 + C-3. D-2, D-3, D-4 depend on D-1.*

---

## Dependency Graph

```
A-1 → A-3 ──────────────→ C-1 → C-2, C-3
      A-3 → A-4 → C-4              ↓
      A-3 → A-5 → A-6 → B-3     D-1 → D-2, D-3, D-4
```

Tracks A and B can run in parallel from day 1. C unblocks when A-3 and A-4 are done. D unblocks when C-3 and A-3 are done.

---

## Key Files

| File | Owner | Notes |
|---|---|---|
| `lib/schema.ts` | Dev A | Central Zod schema — all teams depend on this |
| `lib/cache.ts` | Dev A | In-memory transcript cache |
| `lib/types.ts` | Dev C | Re-export inferred types from schema |
| `app/api/analyze/route.ts` | Dev A | Streaming AI analysis endpoint |
| `app/api/transcribe/route.ts` | Dev A | Audio transcription endpoint |
| `app/page.tsx` | Dev B | Shell layout, replaced by B-5 |
| `components/transcript-input.tsx` | Dev B | Text area + audio upload |
| `components/task-card.tsx` | Dev C | Single task item |
| `components/task-output.tsx` | Dev C | Full output panel |
| `components/participant-tasks.tsx` | Dev D | Per-participant cards |

---

## Decisions

- **Text-first:** Text input is the primary flow; audio upload is additive — do not block on transcription fidelity
- **Streaming output:** Use Vercel AI SDK `streamObject` so the UI feels responsive even on slow completions
- **In-memory cache only:** No database or file system persistence (scope boundary for hackathon)
- **No auth:** Single-user, local-only for hackathon scope
- **shadcn base-nova style preserved:** All new components follow existing token/variant patterns; no design-system changes
- **`@ai-sdk/openai` provider:** Uses `AI_GATEWAY_API_KEY` — Dev A confirms base URL format before starting A-4

---

## Verification Checklist

- [ ] Paste a transcript → click Analyse → structured task list renders within 10 s
- [ ] Tasks show owner badges and priority chips correctly
- [ ] "By Participant" tab shows per-person task lists; "Unassigned" bucket appears when owners are missing
- [ ] Upload an audio file → transcript populates; upload same file again → cached flag returned, no re-transcription call
- [ ] On a narrow viewport (< 1024 px) the layout collapses and tabs work
- [ ] Dark mode toggle (`d` key) does not break any component
- [ ] Dismiss warnings banner — it disappears

---

*Plan version: 2026-04-14 | Team: 4 developers (A/B/C/D)*
