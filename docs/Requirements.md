# Task
Build a simple app that turns a meeting recording or transcript into a clear list of tasks, follow-ups, or next steps.

## A good prototype could show
- A recording is uploaded and transcribed, or a transcript is pasted directly.
- The transcript is converted into a structured summary of tasks and decisions.
- The output is presented clearly enough that someone could act on it immediately.
- Individual task lists per participant/team. 

## Helpful starting points
- Static text input can make iteration much faster while you tune prompts and structure.
- Focus on useful output, not just transcription accuracy.
- A strong prototype will make it obvious what someone should do next after the meeting.
- Start with a small output shape that feels immediately actionable, then expand only if needed.

## Open questions
- Should the app only report the facts? Or could it also present comments about the participant's objectives, needs, feelings? What could we add to the output that would add value?
- What structure makes the output most useful: tasks, owners, deadlines, decisions, follow-ups?
- Should the app support both audio upload and direct transcript input?
- Should the transcript and task summary be shown side by side?
- What should happen when the source material is messy or ambiguous?
- Can we make different summaries for different parties? One for the client and one for us? What input would it require?


# Helper guide

## Quick start

If you want the fastest setup:

```bash
npx shadcn@latest init --template next --base base -d
```

That gives you a working Next.js project with shadcn/ui wired in.

## Environment already available

- `.env.local` includes `AI_GATEWAY_API_KEY`

## Suggested path

1. Start with pasted transcript text while you tune prompts and structure.
2. Add audio upload or recording.
3. Transcribe it.
4. Turn the transcript into structured tasks and follow-ups.
5. Render the result clearly enough that someone could use it immediately.

## General suggestions

- Start with one clear flow from recording to useful output.
- Get the feature working before you spend time polishing the interface.
- Focus on what someone should do next, not just on the transcript itself.
- Keep the first output schema simple and practical.
- Keep a text-input path available so prompt iteration stays fast.

## Useful AI SDK directions

- Transcription is the first transformation step.
- Structured output is a strong fit for:
    - tasks
    - decisions
    - follow-ups
    - optional owners or deadlines
- A side-by-side transcript and task summary could make the demo easier to trust.
- If you stream summaries or follow-ups as markdown, `Streamdown` is a good fit. It handles partial markdown and comes pre-styled for shadcn-style interfaces.

## Specific suggestions

- Store transcriptions so you do not re-transcribe the same file every time.
- A simple local cache keyed by file hash is probably enough for the hackathon.
- Optimize for “what do I do next?” instead of “perfect transcript fidelity.”
- Speaker identification is a good stretch goal, not required for a strong prototype.

## Skills that can help

- `ai-sdk`: core APIs, patterns, and examples
- `shadcn`: useful when assembling UI quickly
- `next-best-practices`: useful for routes, server functions, and app structure
- Explore [https://skills.sh/](https://skills.sh/) if you need something more specific

## Useful links
- Sample meeting: [[Opsummering: The zone - planlægning 14. april | Møde | Microsoft Teams](https://teams.microsoft.com/l/meetingrecap?driveId=b%21wwsZu6HOPEinhCsTRc3aHeMkcIlBROxLgZVQ4Od29xSOoQY2b97gT6_TZSPWkOGg&driveItemId=01BGPCCJ3V3JGZJXB5F5DIEHUXB6ZVV3DZ&sitePath=https%3A%2F%2Foncharlietango-my.sharepoint.com%2F%3Av%3A%2Fg%2Fpersonal%2Fskd_charlietango_dk%2FIQB12k2U3D0vRoIelw-zWux5AZLGS-aQ3eo7S2wHDIpIg7s&fileUrl=https%3A%2F%2Foncharlietango-my.sharepoint.com%2Fpersonal%2Fskd_charlietango_dk%2FDocuments%2FOptagelser%2FThe+zone+-+planl%C3%A6gning-20260414_101005-M%C3%B8deoptagelse.mp4%3Fweb%3D1&iCalUid=040000008200E00074C5B7101A82E008000000002B23F9B5C9BADC01000000000000000010000000DD8BA8431129F5418BCA8C35C9B0058D&threadId=19%3Ameeting_NDEyNDVkZWItZDFmZC00NjI3LWFlMGMtNWM0MTk4OGJlMzAy%40thread.v2&organizerId=dbc1f347-b5ae-4088-80cf-a89d80bc1b41&tenantId=9cd04e4e-30ca-4ff9-9afc-ed82c841f40c&callId=41545b3e-9e7d-45c6-aab4-d44c39584da4&threadType=Meeting&meetingType=Scheduled&subType=RecapSharingLink_RecapCore "https://teams.microsoft.com/l/meetingrecap?driveId=b%21wwsZu6HOPEinhCsTRc3aHeMkcIlBROxLgZVQ4Od29xSOoQY2b97gT6_TZSPWkOGg&driveItemId=01BGPCCJ3V3JGZJXB5F5DIEHUXB6ZVV3DZ&sitePath=https%3A%2F%2Foncharlietango-my.sharepoint.com%2F%3Av%3A%2Fg%2Fpersonal%2Fskd_charlietango_dk%2FIQB12k2U3D0vRoIelw-zWux5AZLGS-aQ3eo7S2wHDIpIg7s&fileUrl=https%3A%2F%2Foncharlietango-my.sharepoint.com%2Fpersonal%2Fskd_charlietango_dk%2FDocuments%2FOptagelser%2FThe+zone+-+planl%C3%A6gning-20260414_101005-M%C3%B8deoptagelse.mp4%3Fweb%3D1&iCalUid=040000008200E00074C5B7101A82E008000000002B23F9B5C9BADC01000000000000000010000000DD8BA8431129F5418BCA8C35C9B0058D&threadId=19%3Ameeting_NDEyNDVkZWItZDFmZC00NjI3LWFlMGMtNWM0MTk4OGJlMzAy%40thread.v2&organizerId=dbc1f347-b5ae-4088-80cf-a89d80bc1b41&tenantId=9cd04e4e-30ca-4ff9-9afc-ed82c841f40c&callId=41545b3e-9e7d-45c6-aab4-d44c39584da4&threadType=Meeting&meetingType=Scheduled&subType=RecapSharingLink_RecapCore")]()
- Next.js docs: [https://nextjs.org/docs](https://nextjs.org/docs)
- shadcn/ui CLI: [https://ui.shadcn.com/docs/cli](https://ui.shadcn.com/docs/cli)
- AI SDK getting started: [https://ai-sdk.dev/docs/getting-started](https://ai-sdk.dev/docs/getting-started)
- Streamdown: [https://streamdown.ai/](https://streamdown.ai/)
