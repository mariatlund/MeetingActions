"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { Bell, Calendar, CheckSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	meetingGenerationResultSchema,
	type MeetingAction,
	type MeetingGenerationResult,
} from "@/lib/meeting-generation-schema";

type GenerateResponse = MeetingGenerationResult;

type HistoryEntry = {
	id: string;
	createdAt: string;
	transcriptFileName: string;
	instructions: string;
	result: GenerateResponse;
};

const HISTORY_SESSION_KEY = "meeting-actions:history";
const MAX_HISTORY_ENTRIES = 20;

function getActionTypeMeta(type: MeetingAction["type"]) {
	if (type === "meeting_to_schedule") {
		return {
			cardClass:
				"border-sky-200 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/30",
			badgeClass:
				"bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
			iconLabel: "Meeting action",
			label: "Meeting",
			Icon: Calendar,
		};
	}

	if (type === "inform_update") {
		return {
			cardClass:
				"border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30",
			badgeClass:
				"bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
			iconLabel: "Inform/update action",
			label: "Communicate",
			Icon: Bell,
		};
	}

	return {
		cardClass:
			"border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30",
		badgeClass:
			"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
		iconLabel: "Task action",
		label: "Task",
		Icon: CheckSquare,
	};
}

function truncateText(text: string, maxLength: number) {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength).trimEnd()}...`;
}

function formatHistoryTimestamp(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "Unknown time";
	}

	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function createHistoryId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseHistoryEntry(value: unknown): HistoryEntry | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Record<string, unknown>;
	const parsedResult = meetingGenerationResultSchema.safeParse(candidate.result);

	if (!parsedResult.success) {
		return null;
	}

	if (
		typeof candidate.id !== "string" ||
		typeof candidate.createdAt !== "string" ||
		typeof candidate.transcriptFileName !== "string" ||
		typeof candidate.instructions !== "string"
	) {
		return null;
	}

	return {
		id: candidate.id,
		createdAt: candidate.createdAt,
		transcriptFileName: candidate.transcriptFileName,
		instructions: candidate.instructions,
		result: parsedResult.data,
	};
}

export default function Page() {
	const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
	const [instructions, setInstructions] = useState("");
	const [fileError, setFileError] = useState("");
	const [apiError, setApiError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<GenerateResponse | null>(null);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
	const [expandedHistoryIds, setExpandedHistoryIds] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		try {
			const raw = window.sessionStorage.getItem(HISTORY_SESSION_KEY);
			if (!raw) {
				return;
			}

			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				window.sessionStorage.removeItem(HISTORY_SESSION_KEY);
				return;
			}

			const validEntries = parsed
				.map((item) => parseHistoryEntry(item))
				.filter((item): item is HistoryEntry => item !== null)
				.slice(0, MAX_HISTORY_ENTRIES);

			setHistoryEntries(validEntries);
			setExpandedHistoryIds(
				Object.fromEntries(validEntries.map((entry, index) => [entry.id, index === 0])),
			);

			if (validEntries.length > 0) {
				setResult(validEntries[0].result);
			}
		} catch {
			window.sessionStorage.removeItem(HISTORY_SESSION_KEY);
		}
	}, []);

	useEffect(() => {
		if (historyEntries.length === 0) {
			window.sessionStorage.removeItem(HISTORY_SESSION_KEY);
			return;
		}

		window.sessionStorage.setItem(
			HISTORY_SESSION_KEY,
			JSON.stringify(historyEntries),
		);
	}, [historyEntries]);

	useEffect(() => {
		if (!isSubmitting) {
			setElapsedSeconds(0);
			return;
		}

		const startedAt = Date.now();
		const intervalId = window.setInterval(() => {
			const seconds = Math.floor((Date.now() - startedAt) / 1000);
			setElapsedSeconds(seconds);
		}, 200);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [isSubmitting]);

	function toggleHistoryItem(entryId: string) {
		setExpandedHistoryIds((prev) => ({
			...prev,
			[entryId]: !prev[entryId],
		}));
	}

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const pickedFile = event.target.files?.[0] ?? null;
		setFileError("");

		if (!pickedFile) {
			setTranscriptFile(null);
			return;
		}

		const hasTxtExtension = pickedFile.name.toLowerCase().endsWith(".txt");
		if (!hasTxtExtension) {
			setTranscriptFile(null);
			setFileError("Please upload a .txt file.");
			return;
		}

		setTranscriptFile(pickedFile);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!transcriptFile) {
			setApiError("Please select a transcript file first.");
			return;
		}

		setIsSubmitting(true);
		setApiError("");
		setResult(null);

		try {
			const formData = new FormData();
			formData.append("transcript", transcriptFile);
			formData.append("instructions", instructions);

			const response = await fetch("/api/meetings/generate", {
				method: "POST",
				body: formData,
			});

			const payload = (await response.json()) as
				| GenerateResponse
				| { error?: string };

			if (!response.ok) {
				const message =
					"error" in payload && payload.error
						? payload.error
						: "Generation failed.";
				setApiError(message);
				return;
			}

			const generationResult = payload as GenerateResponse;
			const newHistoryEntry: HistoryEntry = {
				id: createHistoryId(),
				createdAt: new Date().toISOString(),
				transcriptFileName: transcriptFile.name,
				instructions: instructions.trim(),
				result: generationResult,
			};

			setResult(generationResult);
			setHistoryEntries((prev) =>
				[newHistoryEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES),
			);
			setExpandedHistoryIds((prev) => ({
				...prev,
				[newHistoryEntry.id]: true,
			}));
		} catch {
			setApiError("Something went wrong while generating notes.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start lg:py-12">
			<section className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:flex-1">
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
								Selected file:{" "}
								<span className="font-medium">{transcriptFile.name}</span>
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
						<h2 className="text-2xl font-semibold tracking-tight">Response</h2>
						<div className="space-y-1">
							<p className="text-sm font-semibold uppercase tracking-wide text-foreground">
								Summary
							</p>
							<pre className="whitespace-pre-wrap text-sm">
								{result.summary}
							</pre>
						</div>
						<div className="space-y-1">
							<p className="text-sm font-semibold uppercase tracking-wide text-foreground">
								Actions
							</p>
							{result.actions.length > 0 ? (
								<ul className="space-y-2 text-sm">
									{result.actions.map((action: MeetingAction, index) => {
										const meta = getActionTypeMeta(action.type);
										const Icon = meta.Icon;

										return (
											<li
												key={`${action.title}-${index}`}
												className={`rounded-md border p-3 ${meta.cardClass}`}
											>
												<div className="mb-1 flex items-center gap-2">
													<span
														className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
														aria-label={meta.iconLabel}
														title={meta.iconLabel}
													>
														<Icon className="size-3" />
														{meta.label}
													</span>
												</div>
												<p className="font-medium">{action.title}</p>
												<p className="mt-1">{action.details}</p>
												{action.people.length > 0 ? (
													<div className="mt-2 space-y-1">
														<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
															People
														</p>
														<div className="flex flex-wrap gap-1.5">
															{action.people.map((person, personIndex) => (
																<span
																	key={`${person}-${personIndex}`}
																	className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground"
																>
																	{person}
																</span>
															))}
														</div>
													</div>
												) : null}
											</li>
										);
									})}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									No actions extracted.
								</p>
							)}
						</div>
						<div className="space-y-1">
							<p className="text-sm font-semibold uppercase tracking-wide text-foreground">
								Notes
							</p>
							{result.notes.length > 0 ? (
								<ul className="list-disc space-y-1 pl-5 text-sm">
									{result.notes.map((note, index) => (
										<li key={`${note}-${index}`}>{note}</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									No additional notes.
								</p>
							)}
						</div>
					</section>
				) : null}
			</section>

			<aside className="w-full lg:max-w-sm">
				<section className="rounded-2xl border bg-card p-6 shadow-sm lg:sticky lg:top-6">
					<header className="space-y-1">
						<h2 className="text-lg font-semibold tracking-tight">History</h2>
						<p className="text-xs text-muted-foreground">
							Generated outputs from the current browser session.
						</p>
					</header>

					{historyEntries.length === 0 ? (
						<p className="mt-4 text-sm text-muted-foreground">
							No history yet. Generate your first meeting output to see it here.
						</p>
					) : (
						<ul className="mt-4 space-y-2">
							{historyEntries.map((entry) => {
								const isExpanded = Boolean(expandedHistoryIds[entry.id]);

								return (
									<li key={entry.id} className="overflow-hidden rounded-md border">
										<button
											type="button"
											onClick={() => toggleHistoryItem(entry.id)}
											className="flex w-full items-start justify-between gap-3 bg-background px-3 py-2 text-left transition-colors hover:bg-muted/60"
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-foreground">
													{entry.transcriptFileName}
												</p>
												<p className="text-xs text-muted-foreground">
													{formatHistoryTimestamp(entry.createdAt)}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{entry.result.actions.length} actions • {entry.result.notes.length}{" "}
													notes
												</p>
											</div>
											<ChevronDown
												className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform ${
													isExpanded ? "rotate-180" : "rotate-0"
												}`}
											/>
										</button>

										{isExpanded ? (
											<div className="space-y-2 border-t bg-muted/30 px-3 py-2 text-xs">
												<div>
													<p className="font-medium uppercase tracking-wide text-muted-foreground">
														Summary
													</p>
													<p className="mt-1 text-foreground">
														{truncateText(entry.result.summary, 180)}
													</p>
												</div>

												{entry.instructions ? (
													<div>
														<p className="font-medium uppercase tracking-wide text-muted-foreground">
															Instructions
														</p>
														<p className="mt-1 text-foreground">
															{truncateText(entry.instructions, 120)}
														</p>
													</div>
												) : null}

												{entry.result.actions.length > 0 ? (
													<div>
														<p className="font-medium uppercase tracking-wide text-muted-foreground">
															Action preview
														</p>
														<ul className="mt-1 list-disc space-y-1 pl-4 text-foreground">
															{entry.result.actions.slice(0, 2).map((action, index) => (
																<li key={`${action.title}-${index}`}>
																	{truncateText(action.title, 70)}
																</li>
															))}
														</ul>
													</div>
												) : null}
											</div>
										) : null}
									</li>
								);
							})}
						</ul>
					)}
				</section>
			</aside>
		</main>
	);
}
