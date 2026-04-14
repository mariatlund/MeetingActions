import { z } from "zod"

export const actionTypeSchema = z.enum([
  "meeting_to_schedule",
  "task",
  "inform_update",
])

export const meetingActionSchema = z.object({
  type: actionTypeSchema.describe(
    "Type of action: meeting_to_schedule, task, or inform_update.",
  ),
  title: z.string().min(1).describe("Short action title."),
  details: z
    .string()
    .min(1)
    .describe("Concrete details about what should happen."),
  people: z
    .array(z.string().min(1))
    .describe("People involved in this action. Empty array if unknown."),
})

export const meetingGenerationResultSchema = z.object({
  summary: z
    .string()
    .min(1)
    .describe("Short summary of the meeting outcome and key points."),
  actions: z
    .array(meetingActionSchema)
    .describe("Actionable items from the meeting."),
  notes: z
    .array(z.string().min(1))
    .describe("Additional notes, conclusions, and considerations."),
})

export type MeetingGenerationResult = z.infer<
  typeof meetingGenerationResultSchema
>
export type MeetingAction = z.infer<typeof meetingActionSchema>
