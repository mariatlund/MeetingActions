"use client"

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type GenerateResponse = {
  summary: string
  actions: string
  raw?: string
}

export default function Page() {
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [instructions, setInstructions] = useState("")
  const [fileError, setFileError] = useState("")
  const [apiError, setApiError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!isSubmitting) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = Date.now()
    const intervalId = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000)
      setElapsedSeconds(seconds)
    }, 200)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isSubmitting])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const pickedFile = event.target.files?.[0] ?? null
    setFileError("")

    if (!pickedFile) {
      setTranscriptFile(null)
      return
    }

    const hasTxtExtension = pickedFile.name.toLowerCase().endsWith(".txt")
    if (!hasTxtExtension) {
      setTranscriptFile(null)
      setFileError("Please upload a .txt file.")
      return
    }

    setTranscriptFile(pickedFile)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!transcriptFile) {
      setApiError("Please select a transcript file first.")
      return
    }

    setIsSubmitting(true)
    setApiError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("transcript", transcriptFile)
      formData.append("instructions", instructions)

      const response = await fetch("/api/meetings/generate", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as
        | GenerateResponse
        | { error?: string }

      if (!response.ok) {
        const message =
          "error" in payload && payload.error
            ? payload.error
            : "Generation failed."
        setApiError(message)
        return
      }

      setResult({
        summary: "summary" in payload ? payload.summary : "",
        actions: "actions" in payload ? payload.actions : "",
        raw: "raw" in payload ? payload.raw : undefined,
      })
    } catch {
      setApiError("Something went wrong while generating notes.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Meeting Notes Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload a transcript and add extra AI instructions for how the
            summary and tasks should be generated.
          </p>
        </header>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="transcript"
              className="text-sm font-medium text-foreground"
            >
              Transcript File (.txt)
            </label>
            <input
              id="transcript"
              name="transcript"
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              className="block w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
            />
            {transcriptFile ? (
              <p className="text-xs text-muted-foreground">
                Selected file: <span className="font-medium">{transcriptFile.name}</span>
              </p>
            ) : null}
            {fileError ? (
              <p className="text-xs text-destructive">{fileError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="instructions"
              className="text-sm font-medium text-foreground"
            >
              Additional AI Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={5}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Example: Keep the summary under 6 bullet points and highlight decisions."
              className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            />
            <p className="text-xs text-muted-foreground">
              Optional: explain tone, length, and what to prioritize.
            </p>
          </div>

          <Button type="submit" disabled={!transcriptFile || isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate Notes and Actions"}
          </Button>
        </form>

        {apiError ? (
          <div className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {apiError}
          </div>
        ) : null}

        {isSubmitting ? (
          <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-medium text-foreground">
              Generating notes and actions...
            </p>
            <p className="text-xs text-muted-foreground">
              Elapsed time: {elapsedSeconds}s
            </p>
          </div>
        ) : null}

        {result ? (
          <section className="mt-6 space-y-3 rounded-md border bg-muted/40 p-4">
            <h2 className="text-sm font-semibold">Temporary Response Output</h2>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Summary
              </p>
              <pre className="whitespace-pre-wrap text-sm">{result.summary}</pre>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </p>
              <pre className="whitespace-pre-wrap text-sm">{result.actions}</pre>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}
