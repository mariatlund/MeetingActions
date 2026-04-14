import { gateway } from "ai"
import { generateObject } from "ai"
import { NextResponse } from "next/server"
import { meetingGenerationResultSchema } from "@/lib/meeting-generation-schema"

const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL ?? "openai/gpt-4.1-mini"
const MAX_TRANSCRIPT_CHARS = 120_000

export async function POST(request: Request) {
  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Missing AI_GATEWAY_API_KEY. Add it to .env.local before calling this endpoint.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const transcript = formData.get("transcript")
    const instructions = String(formData.get("instructions") ?? "").trim()

    if (!(transcript instanceof File)) {
      return NextResponse.json(
        { error: "A transcript file is required." },
        { status: 400 },
      )
    }

    const isTxtFile =
      transcript.name.toLowerCase().endsWith(".txt") ||
      transcript.type === "text/plain"

    if (!isTxtFile) {
      return NextResponse.json(
        { error: "Only .txt files are supported right now." },
        { status: 400 },
      )
    }

    const transcriptText = (await transcript.text()).trim()
    if (!transcriptText) {
      return NextResponse.json(
        { error: "Transcript file is empty." },
        { status: 400 },
      )
    }

    if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json(
        {
          error: `Transcript is too large. Max length is ${MAX_TRANSCRIPT_CHARS} characters.`,
        },
        { status: 400 },
      )
    }

    const prompt = `
You are helping generate meeting notes from a transcript.

Return data that matches the schema:
- summary: concise overall meeting summary.
- actions: only concrete actions that are one of:
  1) meetings that need to be scheduled
  2) specific tasks to do
  3) specific people that need to be informed or updated
- notes: everything else worth capturing, such as conclusions, considerations, and context.

Rules:
- Keep actions specific and practical.
- If no actions or notes exist, return empty arrays.
- Do not invent details not supported by the transcript.

Additional instructions from user:
${instructions || "None"}

Transcript:
${transcriptText}
`.trim()

    const { object } = await generateObject({
      model: gateway(DEFAULT_MODEL),
      schema: meetingGenerationResultSchema,
      prompt,
    })

    return NextResponse.json({
      ...object,
      model: DEFAULT_MODEL,
      transcriptFileName: transcript.name,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate meeting notes."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
