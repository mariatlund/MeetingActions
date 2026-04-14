import { generateText } from "ai"
import { gateway } from "ai"
import { NextResponse } from "next/server"

const DEFAULT_MODEL = process.env.AI_GATEWAY_MODEL ?? "openai/gpt-4.1-mini"
const MAX_TRANSCRIPT_CHARS = 120_000

function splitOutputIntoSections(fullText: string) {
  const summaryMatch = fullText.match(
    /summary\s*:?\s*([\s\S]*?)(?:\n\s*actions?\s*:|$)/i,
  )
  const actionsMatch = fullText.match(/actions?\s*:?\s*([\s\S]*)$/i)

  const summary = summaryMatch?.[1]?.trim() ?? fullText.trim()
  const actions = actionsMatch?.[1]?.trim() ?? fullText.trim()

  return { summary, actions }
}

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
You are helping generate meeting notes.

Return output with exactly two sections:
Summary:
- Short summary of what happened in the meeting.

Actions:
- Follow-up actions/tasks and any meetings that should be scheduled.

Additional instructions from user:
${instructions || "None"}

Transcript:
${transcriptText}
`.trim()

    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      prompt,
    })

    const { summary, actions } = splitOutputIntoSections(text)

    return NextResponse.json({
      summary,
      actions,
      raw: text,
      model: DEFAULT_MODEL,
      transcriptFileName: transcript.name,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate meeting notes."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
