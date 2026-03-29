import { z } from "zod";

export const createEventTypeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(1440, "Duration cannot exceed 24 hours"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and dashes")
});

export const updateEventTypeSchema = createEventTypeSchema.partial().extend({
  isActive: z.boolean().optional()
});
