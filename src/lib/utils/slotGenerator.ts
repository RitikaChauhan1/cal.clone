import { addMinutes, isBefore, isAfter, isEqual } from "date-fns";

export interface BookedInterval {
  start: Date;
  end: Date;
}

export function generateAvailableSlots(
  startUtc: Date,
  endUtc: Date,
  durationMinutes: number,
  bookedIntervals: BookedInterval[],
  incrementMinutes: number = 30
): { iso: string; formatted: string }[] {
  const validSlots: { iso: string; formatted: string }[] = [];
  let currentUtc = startUtc;

  while (isBefore(currentUtc, endUtc)) {
    const candidateEnd = addMinutes(currentUtc, durationMinutes);
    if (isAfter(candidateEnd, endUtc)) break; // Do not exceed boundary limit

    const overlaps = bookedIntervals.some(b => 
      (isBefore(currentUtc, b.end) && isAfter(candidateEnd, b.start)) ||
      (isEqual(currentUtc, b.start) && isEqual(candidateEnd, b.end))
    );

    if (!overlaps) {
      // Intentionally omitting 'formatted' logic from pure generator, 
      // but keeping it simple for integration completeness.
      validSlots.push({
        iso: currentUtc.toISOString(),
        formatted: currentUtc.toISOString(), // Let the UI formatter override this
      });
    }

    currentUtc = addMinutes(currentUtc, incrementMinutes);
  }

  return validSlots;
}
