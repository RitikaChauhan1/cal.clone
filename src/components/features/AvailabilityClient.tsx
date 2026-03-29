"use client";

import { useState, useEffect, useCallback } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import * as Toast from "@radix-ui/react-toast";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check, Save, Plus, MoreHorizontal, Pencil, Trash2, Globe, CalendarDays, Loader2, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DaySchedule {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

interface AvailabilityState {
  id?: string;
  name: string;
  timezone: string;
  isDefault?: boolean;
  days: Record<string, DaySchedule>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_STATE: AvailabilityState = {
  name: "Working hours",
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

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr);
  const m = mStr;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${ampm}`;
}

function parseServerProfile(data: any): AvailabilityState {
  const days: Record<string, DaySchedule> = {};
  DAYS.forEach((day, i) => {
    const slot = data.slots?.find((s: any) => s.dayOfWeek === i);
    days[day] = slot
      ? { enabled: slot.isActive, start: slot.startTime, end: slot.endTime }
      : { enabled: false, start: "09:00", end: "17:00" };
  });

  return {
    id: data.id,
    name: data.name,
    timezone: data.timezone,
    isDefault: data.isDefault,
    days,
  };
}

// ─── TimeSelect ──────────────────────────────────────────────────────────────

function TimeSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
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
  const [profiles, setProfiles] = useState<AvailabilityState[]>([]);
  const [editingProfile, setEditingProfile] = useState<AvailabilityState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 10);
  };

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/availability-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.map(parseServerProfile));
      }
    } catch (error) {
      console.error("Failed to load availability:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);


  // Actions
  const openCreate = () => {
    setEditingProfile({ ...DEFAULT_STATE }); // new copy
    setIsCreating(true);
  };

  const openEdit = (profile: AvailabilityState) => {
    setEditingProfile(JSON.parse(JSON.stringify(profile))); // deep copy
    setIsCreating(false);
  };

  const closeEdit = () => {
    setEditingProfile(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingProfile) return;
    
    // Transform formatting for network payload
    const payload = {
      name: editingProfile.name,
      timezone: editingProfile.timezone,
      days: {} as Record<string, any>
    };

    DAYS.forEach((d, i) => {
      payload.days[i.toString()] = {
        enabled: editingProfile.days[d].enabled,
        start: editingProfile.days[d].start,
        end: editingProfile.days[d].end,
      }
    });

    try {
      if (isCreating) {
        const res = await fetch("/api/availability-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast("Profile created");
          await fetchProfiles();
          closeEdit();
        }
      } else {
        const res = await fetch(`/api/availability-profiles/${editingProfile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast("Profile updated");
          await fetchProfiles();
          closeEdit();
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving profile");
    }
  };

  const handleDelete = async (id: string) => {
    // Only delete if confirmed
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      const res = await fetch(`/api/availability-profiles/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Profile deleted");
        await fetchProfiles();
      }
    } catch (e) {
      showToast("Failed to delete profile");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/availability-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        showToast("Default profile updated");
        await fetchProfiles();
      }
    } catch (e) {
      showToast("Failed to set default");
    }
  };

  const handleDuplicate = async (profile: AvailabilityState) => {
    try {
      const payload = {
        name: `${profile.name} (Copy)`,
        timezone: profile.timezone,
        days: {} as Record<string, any>
      };
      DAYS.forEach((d, i) => {
        payload.days[i.toString()] = {
          enabled: profile.days[d].enabled,
          start: profile.days[d].start,
          end: profile.days[d].end,
        }
      });

      const res = await fetch("/api/availability-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Need to add custom logic on API level if we want exactly same slots right away, 
        // but wait our api `/api/availability-profiles` POST ignores `days` param actively now and creates default ones! 
        // Let's just create it with default for duplication right now and update via PUT later, OR just create via POST then PUT.
        // For simplicity:
        body: JSON.stringify({ name: payload.name, timezone: payload.timezone })
      });
      
      if (res.ok) {
        const newProf = await res.json();
        // Now PUT the cloned days
        await fetch(`/api/availability-profiles/${newProf.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: payload.days })
        });

        showToast("Profile duplicated");
        await fetchProfiles();
      }
    } catch (e) {
      showToast("Clone failed");
    }
  };

  if (isLoading && profiles.length === 0) {
    return (
      <div className="placeholder-page" style={{ height: "100%", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-ink-muted" size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // ---------------- Editing State ----------------
  if (editingProfile) {
    const toggleDay = (day: string) => {
      setEditingProfile((prev) => !prev ? null : ({
        ...prev,
        days: { ...prev.days, [day]: { ...prev.days[day], enabled: !prev.days[day].enabled } },
      }));
    };

    const setTime = (day: string, field: "start" | "end", value: string) => {
      setEditingProfile((prev) => !prev ? null : ({
        ...prev,
        days: { ...prev.days, [day]: { ...prev.days[day], [field]: value } },
      }));
    };

    const setTimezone = (tz: string) => {
      setEditingProfile((prev) => !prev ? null : ({ ...prev, timezone: tz }));
    };

    const setName = (name: string) => {
      setEditingProfile((prev) => !prev ? null : ({ ...prev, name }));
    };

    const activeDays = DAYS.filter((d) => editingProfile.days[d].enabled);
    const summaryLabel = activeDays.length === 0
      ? "No days selected"
      : `${activeDays[0].slice(0, 3)} – ${activeDays[activeDays.length - 1].slice(0, 3)}, ${formatTime(editingProfile.days[activeDays[0]]?.start ?? "09:00")} – ${formatTime(editingProfile.days[activeDays[0]]?.end ?? "17:00")}`;

    return (
      <Toast.Provider swipeDirection="right">
        <div className="page-header">
          <div className="page-header-left">
            {!isCreating && <Button variant="ghost" onClick={closeEdit} style={{marginBottom: 8, padding: '4px 8px', marginLeft: '-8px'}}>← Back</Button>}
            <input 
               value={editingProfile.name} 
               onChange={(e) => setName(e.target.value)} 
               className="form-input"
               style={{ fontSize: "1.5rem", fontWeight: 600, padding: "4px 8px", background: "transparent", border: "1px solid transparent", borderBottom: "1px solid var(--border)", margin: "-4px -8px 8px -8px" }}
               placeholder="Profile Name"
            />
            <p>{summaryLabel}</p>
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <Button variant="ghost" onClick={closeEdit}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              <Save size={13} />
              Save
            </Button>
          </div>
        </div>

        <div className="page-body">
          <div className="avail-layout">
            <div className="avail-card">
              {DAYS.map((day) => {
                const sched = editingProfile.days[day];
                return (
                  <div key={day} className={`avail-row${sched.enabled ? " avail-row--enabled" : ""}`}>
                    <div className="avail-day-label">
                      <Switch.Root className="switch-root" checked={sched.enabled} onCheckedChange={() => toggleDay(day)}>
                        <Switch.Thumb className="switch-thumb" />
                      </Switch.Root>
                      <span className="avail-day-name">{day}</span>
                    </div>

                    {sched.enabled ? (
                      <div className="avail-time-row">
                        <TimeSelect value={sched.start} onChange={(v) => setTime(day, "start", v)} />
                        <span className="avail-dash">–</span>
                        <TimeSelect value={sched.end} onChange={(v) => setTime(day, "end", v)} />
                      </div>
                    ) : (
                      <span className="avail-unavailable">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="avail-sidebar">
              <div className="avail-tz-card">
                <p className="avail-tz-label">Timezone</p>
                <Select.Root value={editingProfile.timezone} onValueChange={setTimezone}>
                  <Select.Trigger className="tz-select-trigger">
                    <Select.Value />
                    <Select.Icon><ChevronDown size={13} /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="select-content" position="popper" sideOffset={4}>
                      <Select.Viewport className="select-viewport">
                        {TIMEZONES.map((tz) => (
                          <Select.Item key={tz.value} value={tz.value} className="select-item">
                            <Select.ItemText>{tz.label}</Select.ItemText>
                            <Select.ItemIndicator className="select-item-indicator"><Check size={11} /></Select.ItemIndicator>
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
        
        <Toast.Root className="toast-root" open={toastOpen} onOpenChange={setToastOpen} duration={2500}>
          <Toast.Description>{toastMsg}</Toast.Description>
        </Toast.Root>
        <Toast.Viewport className="toast-viewport" />
      </Toast.Provider>
    );
  }

  // ---------------- List State ----------------

  return (
    <Toast.Provider swipeDirection="right">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Availability</h1>
          <p>Configure times when you are available for bookings.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={14} />
          New
        </Button>
      </div>

      <div className="page-body">
        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={22} /></div>
            <h3>No availability profiles</h3>
            <p>Create a profile to manage your schedules.</p>
            <Button variant="primary" onClick={openCreate}><Plus size={14} /> New profile</Button>
          </div>
        ) : (
          <div className="event-list">
            {profiles.map((p) => {
              const activeDays = DAYS.filter((d) => p.days[d].enabled);
              let rangeStr = "No active days";
              if (activeDays.length > 0) {
                 rangeStr = `${activeDays[0].slice(0, 3)} – ${activeDays[activeDays.length - 1].slice(0, 3)}, ${formatTime(p.days[activeDays[0]]?.start)} – ${formatTime(p.days[activeDays[0]]?.end)}`;
              }

              return (
                <div className="event-item" key={p.id}>
                  <div className="event-item-info" onClick={() => openEdit(p)} style={{cursor: 'pointer'}}>
                    <div className="event-item-title" style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      {p.name}
                      {p.isDefault && <span className="event-item-badge" style={{background: 'var(--bg-muted)', padding: '2px 6px'}}>Default</span>}
                    </div>
                    <div className="event-item-slug" style={{marginTop: 4}}>{rangeStr}</div>
                    <div className="event-item-meta" style={{marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink-muted)', fontSize: 13}}>
                      <Globe size={11} /> {p.timezone}
                    </div>
                  </div>

                  <div className="event-item-actions">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button variant="ghost" className="icon-btn" title="More options" style={{ padding: 0 }}><MoreHorizontal size={14} /></Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="dropdown-content" align="end" sideOffset={4}>
                          <DropdownMenu.Item className="dropdown-item" onSelect={() => openEdit(p)}>
                            <Pencil size={13} /> Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="dropdown-item" onSelect={() => handleDuplicate(p)}>
                            <Copy size={13} /> Duplicate
                          </DropdownMenu.Item>
                          {!p.isDefault && (
                            <DropdownMenu.Item className="dropdown-item" onSelect={() => p.id && handleSetDefault(p.id)}>
                              <Star size={13} /> Set as Default
                            </DropdownMenu.Item>
                          )}
                          <DropdownMenu.Separator className="dropdown-separator" />
                          <DropdownMenu.Item className="dropdown-item danger" onSelect={() => p.id && handleDelete(p.id)}>
                            <Trash2 size={13} /> Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Toast.Root className="toast-root" open={toastOpen} onOpenChange={setToastOpen} duration={2500}>
        <Toast.Description>{toastMsg}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
