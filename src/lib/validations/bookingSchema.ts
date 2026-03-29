import { z } from "zod";

export const createBookingSchema = z.object({
  eventTypeId: z.string().uuid("Invalid eventTypeId"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  startTime: z.string().datetime({ message: "startTime must be a valid UTC ISO string" }),
  endTime: z.string().datetime({ message: "endTime must be a valid UTC ISO string" }),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long")
});
