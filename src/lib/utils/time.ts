import { format, parseISO } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export function padZero(n: number): string {
  return String(n).padStart(2, "0");
}

export function toHostIsoDateString(year: number, month: number, day: number): string {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
}

export function formatLocalTime(isoString: string): string {
  if (!isoString) return "";
  const d = parseISO(isoString);
  return format(d, "h:mm a"); // Uses browser's current timezone natively
}

export function formatLocalDateString(isoString: string): string {
  if (!isoString) return "";
  const d = parseISO(isoString);
  return format(d, "h:mm a · EEE, MMM d, yyyy");
}

export function parseLocalHostDateToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  return fromZonedTime(`${dateStr} ${timeStr}:00`, timezone);
}
