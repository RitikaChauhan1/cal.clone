"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, CalendarDays, CheckCircle2, Globe } from "lucide-react";
import type { EventType, Booking, BookingStatus } from "@/types";

// ─── Storage keys (must match other pages) ───────────────────────────────────
const AVAIL_KEY = "cal_availability";
const EVENTS_KEY = "cal_event_types";
const BOOKINGS_KEY = "cal_bookings";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DaySchedule { enabled: boolean; start: string; end: string; }
interface AvailabilityState { timezone: string; days: Record<string, DaySchedule>; }

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_AVAIL: AvailabilityState = {
  timezone: "Asia/Kolkata",
  days: {
    Sunday:    { enabled: false, start: "09:00", end: "17:00" },
    Monday:    { enabled: true,  start: "09:00", end: "17:00" },
    Tuesday:   { enabled: true,  start: "09:00", end: "17:00" },
    Wednesday: { enabled: true,  start: "09:00", end: "17:00" },
    Thursday:  { enabled: true,  start: "09:00", end: "17:00" },
    Friday:    { enabled: true,  start: "09:00", end: "17:00" },
    Saturday:  { enabled: false, start: "09:00", end: "17:00" },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (mins < endMins) {
    slots.push(`${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`);
    mins += 30;
  }
  return slots;
}

function formatSlot(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr}${ampm}`;
}

function formatDisplayDate(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatConfirmDate(year: number, month: number, day: number, time: string): string {
  const d = new Date(year, month, day);
  const dateStr = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${formatSlot(time)} · ${dateStr}`;
}

function addMins(time: string, duration: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + duration;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Calendar ─────────────────────────────────────────────────────────────────

interface CalendarProps {
  year: number;
  month: number;
  selectedDay: number | null;
  enabledDayNames: Set<string>;
  onSelectDay: (day: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar({ year, month, selectedDay, enabledDayNames, onSelectDay, onPrev, onNext }: CalendarProps) {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  // Days in month, first weekday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  function isDisabled(day: number): boolean {
    // Past dates disabled
    if (year < todayY) return true;
    if (year === todayY && month < todayM) return true;
    if (year === todayY && month === todayM && day < todayD) return true;
    // Check availability
    const dayName = DAYS_OF_WEEK[new Date(year, month, day).getDay()];
    return !enabledDayNames.has(dayName);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Detect month-boundary weeks for label
  const nextMonthName = MONTH_NAMES[(month + 1) % 12];

  return (
    <div className="book-calendar">
      <div className="book-cal-header">
        <span className="book-cal-month">
          <strong>{MONTH_NAMES[month]}</strong> <span className="book-cal-year">{year}</span>
        </span>
        <div className="book-cal-nav">
          <button className="book-cal-nav-btn" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className="book-cal-nav-btn" onClick={onNext} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="book-cal-grid">
        {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((d) => (
          <div key={d} className="book-cal-weekday">{d}</div>
        ))}

        {weeks.map((week, wi) => {
          // Check if this week contains a month boundary
          const hasBoundary = week.some((d, i) => {
            if (!d) return false;
            const nextD = week[i + 1];
            return d && d === daysInMonth && nextD === null;
          });
          // Next month label appears if week crosses into next month
          const crossesBoundary = week.includes(daysInMonth) && week.includes(null) && wi > 0;

          return week.map((day, di) => {
            if (day === null) {
              // Could be next month's day visually — we just show empty
              return <div key={`e-${wi}-${di}`} className="book-cal-cell" />;
            }
            const disabled = isDisabled(day);
            const isToday = year === todayY && month === todayM && day === todayD;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                className={[
                  "book-cal-cell book-cal-day",
                  disabled ? "disabled" : "",
                  isToday ? "today" : "",
                  isSelected ? "selected" : "",
                ].join(" ").trim()}
                disabled={disabled}
                onClick={() => !disabled && onSelectDay(day)}
              >
                {day}
                {isToday && <span className="book-cal-dot" />}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}

// ─── Step: Time slots ─────────────────────────────────────────────────────────

interface TimeSlotsProps {
  year: number;
  month: number;
  day: number;
  slots: string[];
  onSelect: (time: string) => void;
}

function TimeSlots({ year, month, day, slots, onSelect }: TimeSlotsProps) {
  const d = new Date(year, month, day);
  const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="book-slots-panel">
      <div className="book-slots-header">
        <span className="book-slots-day">{dayLabel}</span>
      </div>
      <div className="book-slots-list">
        {slots.length === 0 ? (
          <p className="book-slots-empty">No available slots for this day.</p>
        ) : (
          slots.map((slot) => (
            <button key={slot} className="book-slot-btn" onClick={() => onSelect(slot)}>
              {formatSlot(slot)}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Step: Details form ───────────────────────────────────────────────────────

interface DetailsFormProps {
  onBack: () => void;
  onConfirm: (name: string, email: string) => void;
  dateLabel: string;
}

function DetailsForm({ onBack, onConfirm, dateLabel }: DetailsFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const e: { name?: string; email?: string } = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onConfirm(name.trim(), email.trim());
  };

  return (
    <div className="book-details-panel">
      <button className="book-back-btn" onClick={onBack}>
        <ChevronLeft size={14} /> Back
      </button>
      <div className="book-details-date">{dateLabel}</div>

      <div className="form-field">
        <label className="form-label">Your name *</label>
        <input
          className={`form-input${errors.name ? " input-error" : ""}`}
          placeholder="Full name"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
          autoFocus
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-field">
        <label className="form-label">Email address *</label>
        <input
          className={`form-input${errors.email ? " input-error" : ""}`}
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      <button className="btn btn-primary book-confirm-btn" onClick={handleSubmit}>
        Confirm booking
      </button>
    </div>
  );
}

// ─── Step: Confirmation ───────────────────────────────────────────────────────

function ConfirmationScreen({ title, name, dateLabel }: { title: string; name: string; dateLabel: string }) {
  return (
    <div className="book-confirmation">
      <CheckCircle2 size={48} className="book-confirm-icon" strokeWidth={1.5} />
      <h2 className="book-confirm-title">You're booked!</h2>
      <p className="book-confirm-subtitle">
        A confirmation has been sent to you for <strong>{title}</strong>.
      </p>
      <div className="book-confirm-detail">
        <CalendarDays size={14} />
        {dateLabel}
      </div>
      <div className="book-confirm-detail">
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Booked as <strong>{name}</strong></span>
      </div>
      <a href="/" className="btn btn-ghost" style={{ marginTop: 8 }}>
        Back to home
      </a>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Step = "calendar" | "details" | "confirmed";

export function BookingPageClient({ slug }: { slug: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("calendar");
  const [confirmedName, setConfirmedName] = useState("");

  const [avail, setAvail] = useState<AvailabilityState>(DEFAULT_AVAIL);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawAvail = localStorage.getItem(AVAIL_KEY);
      if (rawAvail) setAvail(JSON.parse(rawAvail));
    } catch {}

    try {
      const rawEvents = localStorage.getItem(EVENTS_KEY);
      if (rawEvents) {
        const events: EventType[] = JSON.parse(rawEvents);
        const found = events.find((e) => e.slug === slug && e.enabled);
        setEventType(found ?? null);
      }
    } catch {}

    setHydrated(true);
  }, [slug]);

  const enabledDayNames = useMemo(() => {
    return new Set(
      Object.entries(avail.days)
        .filter(([, sched]) => sched.enabled)
        .map(([name]) => name)
    );
  }, [avail]);

  const slots = useMemo(() => {
    if (selectedDay === null) return [];
    const dayName = DAYS_OF_WEEK[new Date(year, month, selectedDay).getDay()];
    const sched = avail.days[dayName];
    if (!sched?.enabled) return [];
    return generateSlots(sched.start, sched.end);
  }, [selectedDay, year, month, avail]);

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const handleConfirm = (name: string, email: string) => {
    if (!selectedDay || !selectedTime || !eventType) return;
    const duration = eventType.duration;
    const endTime = addMins(selectedTime, duration);
    const booking: Booking = {
      id: uid(),
      title: eventType.title,
      attendee: name,
      date: toISODate(year, month, selectedDay),
      startTime: selectedTime,
      endTime,
      status: "upcoming" as BookingStatus,
    };
    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);
      const existing: Booking[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([...existing, booking]));
    } catch {}
    setConfirmedName(name);
    setStep("confirmed");
  };

  if (!hydrated) return null;

  // Event not found or disabled
  if (!eventType) {
    return (
      <div className="book-shell-inner">
        <div className="book-not-found">
          <CalendarDays size={40} strokeWidth={1.5} />
          <h2>Event not found</h2>
          <p>This event type doesn't exist or has been disabled.</p>
          <a href="/" className="btn btn-ghost">Go back</a>
        </div>
      </div>
    );
  }

  const dateLabel = selectedDay !== null && selectedTime !== null
    ? formatConfirmDate(year, month, selectedDay, selectedTime)
    : "";

  return (
    <div className="book-shell-inner">
      <div className="book-card">
        {/* Left info panel */}
        <div className="book-info-panel">
          <div className="book-info-avatar">A</div>
          <p className="book-info-host">Admin</p>
          <h1 className="book-info-title">{eventType.title}</h1>
          {eventType.description && (
            <p className="book-info-desc">{eventType.description}</p>
          )}
          <div className="book-info-meta">
            <span className="book-info-meta-item">
              <Clock size={13} />
              {eventType.duration}m
            </span>
            <span className="book-info-meta-item">
              <Globe size={13} />
              {avail.timezone}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="book-divider" />

        {/* Right panel — changes per step */}
        {step === "confirmed" && selectedDay !== null && selectedTime !== null ? (
          <ConfirmationScreen
            title={eventType.title}
            name={confirmedName}
            dateLabel={formatConfirmDate(year, month, selectedDay, selectedTime)}
          />
        ) : step === "details" && selectedDay !== null && selectedTime !== null ? (
          <DetailsForm
            onBack={() => setStep("calendar")}
            onConfirm={handleConfirm}
            dateLabel={dateLabel}
          />
        ) : (
          // Calendar + optional time slots side by side
          <div className="book-picker">
            <Calendar
              year={year}
              month={month}
              selectedDay={selectedDay}
              enabledDayNames={enabledDayNames}
              onSelectDay={(day) => { setSelectedDay(day); setSelectedTime(null); }}
              onPrev={() => {
                if (month === 0) { setMonth(11); setYear((y) => y - 1); }
                else setMonth((m) => m - 1);
                setSelectedDay(null);
              }}
              onNext={() => {
                if (month === 11) { setMonth(0); setYear((y) => y + 1); }
                else setMonth((m) => m + 1);
                setSelectedDay(null);
              }}
            />
            {selectedDay !== null && (
              <>
                <div className="book-divider book-divider--vertical" />
                <TimeSlots
                  year={year}
                  month={month}
                  day={selectedDay}
                  slots={slots}
                  onSelect={handleSelectTime}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
