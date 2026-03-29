"use client";

import { useState, useEffect, useMemo } from "react";
import * as Toast from "@radix-ui/react-toast";
import { ChevronLeft, ChevronRight, Clock, CalendarDays, CheckCircle2, Globe, Loader2 } from "lucide-react";
import type { EventType } from "@/types";
import { Button } from "@/components/ui/Button";

// Enhanced Date/Time Logic Using date-fns and date-fns-tz
import { addMinutes, format, parseISO, isBefore, isAfter, isEqual } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface DaySchedule { enabled: boolean; start: string; end: string; }
interface AvailabilityState { timezone: string; days: Record<string, DaySchedule>; }

const DEFAULT_AVAIL: AvailabilityState = {
  timezone: "Asia/Kolkata",
  days: {
    Sunday: { enabled: false, start: "09:00", end: "17:00" },
    Monday: { enabled: true, start: "09:00", end: "17:00" },
    Tuesday: { enabled: true, start: "09:00", end: "17:00" },
    Wednesday: { enabled: true, start: "09:00", end: "17:00" },
    Thursday: { enabled: true, start: "09:00", end: "17:00" },
    Friday: { enabled: true, start: "09:00", end: "17:00" },
    Saturday: { enabled: false, start: "09:00", end: "17:00" },
  },
};

function pad(n: number) { return String(n).padStart(2, "0"); }

// ─── Component: Calendar ──────────────────────────────────────────────────────
interface CalendarProps {
  year: number;
  month: number;
  selectedDay: number | null;
  enabledDayNames: Set<string>;
  onSelectDay: (day: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

function Calendar({ year, month, selectedDay, enabledDayNames, onSelectDay, onPrev, onNext }: CalendarProps) {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  function isDisabled(day: number): boolean {
    if (year < todayY) return true;
    if (year === todayY && month < todayM) return true;
    if (year === todayY && month === todayM && day < todayD) return true;
    const dayName = DAYS_OF_WEEK[new Date(year, month, day).getDay()];
    return !enabledDayNames.has(dayName);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

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
        {weeks.map((week, wi) => (
          week.map((day, di) => {
            if (day === null) {
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
          })
        ))}
      </div>
    </div>
  );
}

// ─── Component: Time Slots ────────────────────────────────────────────────────
interface TimeSlotsProps {
  dateObj: Date;
  slots: { iso: string; formatted: string; booked: boolean }[];
  isLoading: boolean;
  onSelect: (isoTime: string) => void;
}

function TimeSlots({ dateObj, slots, isLoading, onSelect }: TimeSlotsProps) {
  const dayLabel = format(dateObj, "EEE, MMM d");
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="book-slots-panel">
      <div className="book-slots-header">
        <span className="book-slots-day">{dayLabel}</span>
        <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
          Times shown in {localTz}
        </span>
      </div>
      <div className="book-slots-list">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', color: 'var(--ink-muted)' }}>
             <Loader2 size={24} className="spin" />
          </div>
        ) : slots.length === 0 ? (
          <p className="book-slots-empty">No slots available for this day.</p>
        ) : (
          slots.map((slot) => (
            <button
              key={slot.iso}
              className={`book-slot-btn${slot.booked ? " booked" : ""}`}
              disabled={slot.booked}
              onClick={() => !slot.booked && onSelect(slot.iso)}
            >
              {slot.formatted}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Component: Details Form ──────────────────────────────────────────────────
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
      <Button variant="ghost" className="book-back-btn" onClick={onBack}>
        <ChevronLeft size={14} /> Back
      </Button>
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

      <Button variant="primary" className="book-confirm-btn" onClick={handleSubmit}>
        Confirm booking
      </Button>
    </div>
  );
}

// ─── Component: Confirmation ──────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────────────────
type Step = "calendar" | "details" | "confirmed";

export function BookingPageClient({ slug }: { slug: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // selectedTime ISO String (Strict UTC)
  const [selectedTimeISO, setSelectedTimeISO] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("calendar");
  const [confirmedName, setConfirmedName] = useState("");

  const [avail, setAvail] = useState<AvailabilityState>(DEFAULT_AVAIL);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [hydrated, setHydrated] = useState(false);
  
  // Stored Bookings strictly from backend
  const [bookedIntervals, setBookedIntervals] = useState<{ start: Date, end: Date }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Toast State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch("/api/availability-profiles/default");
        if (res.ok) {
          const data = await res.json();
          setAvail(data);
        }
      } catch (error) {
        console.error("Failed to load availability:", error);
      }
    };

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/event-types/slug/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.isActive) {
            setEventType(data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch event", e);
      }
    };

    Promise.all([fetchAvailability(), fetchEvent()]).finally(() => {
      setHydrated(true);
    });
  }, [slug]);

  const enabledDayNames = useMemo(() => {
    return new Set(
      Object.entries(avail.days)
        .filter(([, sched]) => sched.enabled)
        .map(([name]) => name)
    );
  }, [avail]);

  // Fetch blocked booking bounds seamlessly whenever a calendar day is clicked.
  useEffect(() => {
    if (selectedDay === null || !eventType) {
      setBookedIntervals([]);
      return;
    }
    const fetchBookings = async () => {
      setIsLoadingSlots(true);
      const hostDateStr = `${year}-${pad(month + 1)}-${pad(selectedDay)}`; 
      try {
        const res = await fetch(`/api/bookings?date=${hostDateStr}&eventTypeId=${eventType.id}`);
        if (res.ok) {
          const data = await res.json();
          // Safely map string arrays to Date instances
          const intervals = data.bookings.map((b: any) => ({
            start: parseISO(b.startTime),
            end: parseISO(b.endTime),
          }));
          setBookedIntervals(intervals);
        }
      } catch (e) {
        console.error("Failed to fetch booked slots", e);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchBookings();
  }, [selectedDay, year, month, eventType]);

  // Slot Pipeline: Map Host Availability -> Generate UTC Boundary Candidates -> Exclude Overlaps
  const slots = useMemo(() => {
    if (selectedDay === null || !eventType) return [];
    
    // 1. Identify Host Bounds Object exactly
    const dayName = DAYS_OF_WEEK[new Date(year, month, selectedDay).getDay()];
    const sched = avail.days[dayName];
    if (!sched?.enabled) return [];
    
    // 2. Map pure UTC Date object representations corresponding to host's timezone wall-clock
    const hostDateStr = `${year}-${pad(month + 1)}-${pad(selectedDay)}`; 
    const startUtc = fromZonedTime(`${hostDateStr} ${sched.start}:00`, avail.timezone);
    const endUtc = fromZonedTime(`${hostDateStr} ${sched.end}:00`, avail.timezone);
    
    const validSlots: { iso: string; formatted: string; booked: boolean }[] = [];
    let currentUtc = startUtc;

    // 3. Scan & Project 30 Minute Increments
    while (isBefore(currentUtc, endUtc)) {
      const candidateEnd = addMinutes(currentUtc, eventType.duration);
      if (isAfter(candidateEnd, endUtc)) break; // Do not exceed end boundary!

      // Strict Overlap Validation
      const overlaps = bookedIntervals.some(b =>
        (isBefore(currentUtc, b.end) && isAfter(candidateEnd, b.start)) ||
        (isEqual(currentUtc, b.start) && isEqual(candidateEnd, b.end))
      );

      validSlots.push({
        iso: currentUtc.toISOString(),
        formatted: format(currentUtc, "h:mm a"), // Native browser localization!
        booked: overlaps,
      });

      currentUtc = addMinutes(currentUtc, 30);
    }
    
    return validSlots;
  }, [selectedDay, year, month, avail, eventType, bookedIntervals]);

  const handleSelectTime = (isoTime: string) => {
    setSelectedTimeISO(isoTime);
    setStep("details");
  };

  const handleConfirm = async (name: string, email: string) => {
    if (!selectedDay || !selectedTimeISO || !eventType) return;
    
    const startUtc = parseISO(selectedTimeISO);
    const endUtc = addMinutes(startUtc, eventType.duration);
    
    // Use the Host wall-clock date string as partitioning key to match fetching behavior
    const hostDateStr = `${year}-${pad(month + 1)}-${pad(selectedDay)}`; 
    
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          date: hostDateStr,
          startTime: startUtc.toISOString(),
          endTime: endUtc.toISOString(),
          email,
          name
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setToastMsg(data.error || "Failed to book slot");
        setToastOpen(true);
        return;
      }
      
      setConfirmedName(name);
      setStep("confirmed");
    } catch {
      setToastMsg("An unexpected error occurred.");
      setToastOpen(true);
    }
  };

  if (!hydrated) return null;

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

  // Generate localized user confirmation string (e.g. "10:30 AM · Wed, Mar 24, 2026")
  let dateLabel = "";
  if (selectedTimeISO) {
    const d = parseISO(selectedTimeISO);
    dateLabel = format(d, "h:mm a · EEE, MMM d, yyyy");
  }

  return (
    <Toast.Provider swipeDirection="right">
      <div className="book-shell-inner">
        <div className="book-card">
          {/* Left panel */}
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

          <div className="book-divider" />

          {/* Right panel logic */}
          {step === "confirmed" && selectedTimeISO ? (
            <ConfirmationScreen
              title={eventType.title}
              name={confirmedName}
              dateLabel={dateLabel}
            />
          ) : step === "details" && selectedTimeISO ? (
            <DetailsForm
              onBack={() => setStep("calendar")}
              onConfirm={handleConfirm}
              dateLabel={dateLabel}
            />
          ) : (
            <div className="book-picker">
              <Calendar
                year={year}
                month={month}
                selectedDay={selectedDay}
                enabledDayNames={enabledDayNames}
                onSelectDay={(day) => { setSelectedDay(day); setSelectedTimeISO(null); }}
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
                    dateObj={new Date(year, month, selectedDay)}
                    slots={slots}
                    isLoading={isLoadingSlots}
                    onSelect={handleSelectTime}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Toast.Root className="toast-root" open={toastOpen} onOpenChange={setToastOpen} duration={3500}>
        <Toast.Description>{toastMsg}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
