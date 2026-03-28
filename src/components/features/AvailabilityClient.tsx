"use client";

import { useState, useEffect } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import * as Toast from "@radix-ui/react-toast";
import { ChevronDown, Check, Save } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DaySchedule {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

interface AvailabilityState {
  timezone: string;
  days: Record<string, DaySchedule>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_STATE: AvailabilityState = {
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

const TIMEZONES = [
  { value: "Asia/Kolkata",      label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "UTC",               label: "UTC (UTC+0)" },
  { value: "Europe/London",     label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris",      label: "Europe/Paris (CET, UTC+1)" },
  { value: "America/New_York",  label: "America/New_York (ET, UTC-5)" },
  { value: "America/Chicago",   label: "America/Chicago (CT, UTC-6)" },
  { value: "America/Denver",    label: "America/Denver (MT, UTC-7)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PT, UTC-8)" },
  { value: "Asia/Dubai",        label: "Asia/Dubai (GST, UTC+4)" },
  { value: "Asia/Singapore",    label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo",        label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "Australia/Sydney",  label: "Australia/Sydney (AEDT, UTC+11)" },
];

// Generate time options in 30-min increments: 12:00am → 11:30pm
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "am" : "pm";
      const label = `${hour12}:${mm}${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();
const STORAGE_KEY = "cal_availability";

// ─── TimeSelect ──────────────────────────────────────────────────────────────

function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger className="time-select-trigger" aria-label="Time">
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={12} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={4}>
          <Select.Viewport className="select-viewport">
            {TIME_OPTIONS.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} className="select-item">
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="select-item-indicator">
                  <Check size={11} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AvailabilityClient() {
  const [avail, setAvail] = useState<AvailabilityState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAvail(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const toggleDay = (day: string) => {
    setAvail((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: { ...prev.days[day], enabled: !prev.days[day].enabled },
      },
    }));
  };

  const setTime = (day: string, field: "start" | "end", value: string) => {
    setAvail((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: { ...prev.days[day], [field]: value },
      },
    }));
  };

  const setTimezone = (tz: string) => {
    setAvail((prev) => ({ ...prev, timezone: tz }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(avail));
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 10);
  };

  const activeDays = DAYS.filter((d) => avail.days[d].enabled);
  const summaryLabel =
    activeDays.length === 0
      ? "No days selected"
      : `${activeDays[0].slice(0, 3)} – ${activeDays[activeDays.length - 1].slice(0, 3)}, ${formatTime(avail.days[activeDays[0]]?.start ?? "09:00")} – ${formatTime(avail.days[activeDays[0]]?.end ?? "17:00")}`;

  return (
    <Toast.Provider swipeDirection="right">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Availability</h1>
          <p>{summaryLabel}</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={13} />
          Save
        </button>
      </div>

      <div className="page-body">
        <div className="avail-layout">

          {/* Days + time slots */}
          <div className="avail-card">
            {DAYS.map((day) => {
              const sched = avail.days[day];
              return (
                <div key={day} className={`avail-row${sched.enabled ? " avail-row--enabled" : ""}`}>
                  {/* Toggle + day name */}
                  <div className="avail-day-label">
                    <Switch.Root
                      className="switch-root"
                      checked={sched.enabled}
                      onCheckedChange={() => toggleDay(day)}
                      aria-label={`Toggle ${day}`}
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                    <span className="avail-day-name">{day}</span>
                  </div>

                  {/* Time slots or "Unavailable" */}
                  {sched.enabled ? (
                    <div className="avail-time-row">
                      <TimeSelect
                        value={sched.start}
                        onChange={(v) => setTime(day, "start", v)}
                      />
                      <span className="avail-dash">–</span>
                      <TimeSelect
                        value={sched.end}
                        onChange={(v) => setTime(day, "end", v)}
                      />
                    </div>
                  ) : (
                    <span className="avail-unavailable">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timezone panel */}
          <div className="avail-sidebar">
            <div className="avail-tz-card">
              <p className="avail-tz-label">Timezone</p>
              <Select.Root value={avail.timezone} onValueChange={setTimezone}>
                <Select.Trigger className="tz-select-trigger">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={13} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="select-content" position="popper" sideOffset={4}>
                    <Select.Viewport className="select-viewport">
                      {TIMEZONES.map((tz) => (
                        <Select.Item key={tz.value} value={tz.value} className="select-item">
                          <Select.ItemText>{tz.label}</Select.ItemText>
                          <Select.ItemIndicator className="select-item-indicator">
                            <Check size={11} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

        </div>
      </div>

      <Toast.Root
        className="toast-root"
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={2500}
      >
        <Toast.Description>Availability saved</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr);
  const m = mStr;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${ampm}`;
}
