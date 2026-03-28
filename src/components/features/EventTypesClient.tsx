"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Switch from "@radix-ui/react-switch";
import * as Toast from "@radix-ui/react-toast";
import { Plus, Clock, MoreHorizontal, Pencil, Trash2, Link2, X, CalendarDays } from "lucide-react";
import type { EventType } from "@/types";

// ─── helpers ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "cal_event_types";

const DEFAULT_EVENTS: EventType[] = [
  {
    id: "1",
    title: "Quick sync",
    duration: 15,
    slug: "quick-sync",
    description: "A short 15-minute catch-up.",
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "30 min meeting",
    duration: 30,
    slug: "30-min-meeting",
    description: "Standard half-hour meeting.",
    enabled: true,
    createdAt: new Date().toISOString(),
  },
];

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── EventForm ─────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  duration: string;
  description: string;
  slug: string;
}

const EMPTY_FORM: FormState = { title: "", duration: "30", description: "", slug: "" };

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: EventType;
  onSave: (data: Omit<EventType, "id" | "createdAt" | "enabled">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? { title: initial.title, duration: String(initial.duration), description: initial.description, slug: initial.slug }
      : EMPTY_FORM
  );

  const [slugManual, setSlugManual] = useState(!!initial);

  const set = (key: keyof FormState, val: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "title" && !slugManual) {
        next.slug = toSlug(val);
      }
      return next;
    });
  };

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    set("slug", val);
  };

  const valid = form.title.trim().length > 0 && form.slug.trim().length > 0 && Number(form.duration) > 0;

  return (
    <>
      <div className="form-field">
        <label className="form-label">Title *</label>
        <input
          className="form-input"
          placeholder="e.g. 30 min meeting"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-field">
        <label className="form-label">URL slug *</label>
        <input
          className="form-input"
          placeholder="30-min-meeting"
          value={form.slug}
          onChange={(e) => handleSlugChange(toSlug(e.target.value))}
        />
        <p className="form-hint">book/{form.slug || "your-slug"}</p>
      </div>

      <div className="form-field">
        <label className="form-label">Duration (minutes) *</label>
        <select
          className="form-select"
          value={form.duration}
          onChange={(e) => set("duration", e.target.value)}
        >
          {[15, 20, 30, 45, 60, 90, 120].map((d) => (
            <option key={d} value={String(d)}>
              {d} min
            </option>
          ))}
        </select>
      </div>

      <div className="form-field" style={{ marginBottom: 0 }}>
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          placeholder="Brief description of this event type…"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="dialog-footer">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={!valid}
          onClick={() =>
            onSave({
              title: form.title.trim(),
              duration: Number(form.duration),
              slug: form.slug.trim(),
              description: form.description.trim(),
            })
          }
          style={{ opacity: valid ? 1 : 0.45, cursor: valid ? "pointer" : "not-allowed" }}
        >
          {initial ? "Save changes" : "Create event type"}
        </button>
      </div>
    </>
  );
}

// ─── EventItem ─────────────────────────────────────────────────────────────

function EventItem({
  event,
  onEdit,
  onDelete,
  onToggle,
  onCopyLink,
}: {
  event: EventType;
  onEdit: (e: EventType) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onCopyLink: (slug: string) => void;
}) {
  return (
    <div className="event-item">
      <div className="event-item-info">
        <div className="event-item-title">{event.title}</div>
        <div className="event-item-slug">book/{event.slug}</div>
        <div className="event-item-badge">
          <Clock size={11} />
          {event.duration}m
        </div>
      </div>

      <div className="event-item-actions">
        {/* Copy link */}
        <button
          className="icon-btn"
          title="Copy link"
          onClick={() => onCopyLink(event.slug)}
        >
          <Link2 size={14} />
        </button>

        {/* Toggle enabled */}
        <Switch.Root
          className="switch-root"
          checked={event.enabled}
          onCheckedChange={() => onToggle(event.id)}
          aria-label={event.enabled ? "Disable event type" : "Enable event type"}
        >
          <Switch.Thumb className="switch-thumb" />
        </Switch.Root>

        {/* More actions dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="icon-btn" title="More options">
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="dropdown-content" align="end" sideOffset={4}>
              <DropdownMenu.Item className="dropdown-item" onSelect={() => onEdit(event)}>
                <Pencil size={13} />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="dropdown-separator" />
              <DropdownMenu.Item className="dropdown-item danger" onSelect={() => onDelete(event.id)}>
                <Trash2 size={13} />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function EventTypesClient() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setEvents(raw ? JSON.parse(raw) : DEFAULT_EVENTS);
    } catch {
      setEvents(DEFAULT_EVENTS);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever events change (after hydration)
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(false);
    // small delay so closing/reopening triggers animation
    setTimeout(() => setToastOpen(true), 10);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const openEdit = (event: EventType) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleSave = useCallback(
    (data: Omit<EventType, "id" | "createdAt" | "enabled">) => {
      if (editingEvent) {
        setEvents((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data } : e))
        );
        showToast("Event type updated");
      } else {
        const newEvent: EventType = {
          ...data,
          id: uid(),
          enabled: true,
          createdAt: new Date().toISOString(),
        };
        setEvents((prev) => [...prev, newEvent]);
        showToast("Event type created");
      }
      setDialogOpen(false);
    },
    [editingEvent]
  );

  const handleDelete = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast("Event type deleted");
  }, []);

  const handleToggle = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  }, []);

  const handleCopyLink = useCallback((slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => showToast("Link copied to clipboard"));
  }, []);

  // Prevent SSR mismatch — render nothing until hydrated
  if (!hydrated) return null;

  return (
    <Toast.Provider swipeDirection="right">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Event types</h1>
          <p>Configure different events for people to book on your calendar.</p>
        </div>

        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Page body */}
      <div className="page-body">
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CalendarDays size={22} />
            </div>
            <h3>No event types yet</h3>
            <p>Create your first event type and start accepting bookings.</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} />
              New event type
            </button>
          </div>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onCopyLink={handleCopyLink}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">
              {editingEvent ? "Edit event type" : "New event type"}
            </Dialog.Title>
            <Dialog.Description className="dialog-description">
              {editingEvent
                ? "Update the details for this event type."
                : "Add a new event type that people can book on your calendar."}
            </Dialog.Description>

            <Dialog.Close asChild>
              <button className="dialog-close">
                <X size={14} />
              </button>
            </Dialog.Close>

            <EventForm
              key={editingEvent?.id ?? "new"}
              initial={editingEvent ?? undefined}
              onSave={handleSave}
              onCancel={() => setDialogOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast notifications */}
      <Toast.Root
        className="toast-root"
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={2500}
      >
        <Toast.Description>{toastMsg}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
