import { z } from "zod";

export const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:mm)"),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:mm)")
}).refine(data => {
  if (!data.enabled) return true;
  const [sh, sm] = data.start.split(":").map(Number);
  const [eh, em] = data.end.split(":").map(Number);
  return (sh * 60 + sm) < (eh * 60 + em);
}, { message: "start time must be before end time" });

export const createAvailabilityProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  timezone: z.string().min(1, "Timezone is required"),
  isDefault: z.boolean().optional(),
  days: z.record(z.string(), dayScheduleSchema)
});

export const updateAvailabilityProfileSchema = createAvailabilityProfileSchema.partial();
