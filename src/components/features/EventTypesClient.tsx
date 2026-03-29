"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Switch from "@radix-ui/react-switch";
import * as Toast from "@radix-ui/react-toast";
import { Plus, Clock, MoreHorizontal, Pencil, Trash2, Link2, ExternalLink, X, CalendarDays, Loader2, Search } from "lucide-react";
import type { EventType } from "@/types";
import { Button } from "@/components/ui/Button";

// ─── helpers ───────────────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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
  onSave: (data: Omit<EventType, "id" | "createdAt" | "isActive">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? { title: initial.title, duration: String(initial.duration), description: initial.description || "", slug: initial.slug }
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
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
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
        </Button>
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
  onToggle: (id: string, currentStatus: boolean) => void;
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
        {/* External link */}
        <a
          href={`/book/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          title="Go to booking page"
        >
          <ExternalLink size={14} />
        </a>

        {/* Copy link */}
        <Button
          variant="ghost"
          title="Copy link"
          onClick={() => onCopyLink(event.slug)}
        >
          <Link2 size={14} />
        </Button>

        {/* Toggle enabled */}
        <Switch.Root
          className="switch-root"
          checked={event.isActive}
          onCheckedChange={() => onToggle(event.id, event.isActive)}
          aria-label={event.isActive ? "Disable event type" : "Enable event type"}
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/event-types');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(false);
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
    async (data: Omit<EventType, "id" | "createdAt" | "isActive">) => {
      try {
        if (editingEvent) {
          const res = await fetch(`/api/event-types/${editingEvent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            await fetchEvents();
            showToast("Event type updated");
          } else {
            showToast("Failed to update event type");
          }
        } else {
          const res = await fetch('/api/event-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            await fetchEvents();
            showToast("Event type created");
          } else {
            showToast("Failed to create event type. Slug might be invalid.");
          }
        }
      } catch (error) {
        console.error("Failed to save event", error);
        showToast("An error occurred");
      }
      setDialogOpen(false);
    },
    [editingEvent, fetchEvents]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/event-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchEvents();
        showToast("Event type deleted");
      } else {
        showToast("Failed to delete event type");
      }
    } catch (error) {
      console.error("Failed to delete event", error);
    }
  }, [fetchEvents]);

  const handleToggle = useCallback(async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === id ? { ...e, isActive: !currentStatus } : e));
    try {
      const res = await fetch(`/api/event-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setEvents(prev => prev.map(e => e.id === id ? { ...e, isActive: currentStatus } : e));
        showToast("Failed to update status");
      }
    } catch (error) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isActive: currentStatus } : e));
      console.error("Failed to toggle status", error);
    }
  }, []);

  const handleCopyLink = useCallback((slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => showToast("Link copied to clipboard"));
  }, []);

  if (isLoading) {
    return (
      <div className="placeholder-page" style={{ height: "100%", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-ink-muted" size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <Toast.Provider swipeDirection="right">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Event types</h1>
          <p>Configure different events for people to book on your calendar.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="search-input-container" style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-muted)" }} />
            <input 
              className="form-input" 
              placeholder="Search" 
              style={{ paddingLeft: "32px", width: "180px", height: "32px", fontSize: "14px" }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={14} />
            New
          </Button>
        </div>
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
            <Button variant="primary" onClick={openCreate}>
              <Plus size={14} />
              New event type
            </Button>
          </div>
        ) : (
          <div className="event-list">
            {events
              .filter(event => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((event) => (
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

