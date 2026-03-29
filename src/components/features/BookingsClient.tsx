"use client";

import { useState, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Toast from "@radix-ui/react-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreHorizontal, XCircle, X, BookOpen, Loader2 } from "lucide-react";
import type { Booking, BookingStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return format(d, "h:mm aaa");
}

// Group upcoming bookings by date label
function groupByDate(bookings: Booking[]): { label: string; items: Booking[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups: Record<string, Booking[]> = {};
  for (const b of bookings) {
    const d = new Date(b.date + "T00:00:00");
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    let label: string;
    if (diff === 0) label = "Today";
    else if (diff === 1) label = "Tomorrow";
    else label = "Upcoming";
    groups[label] = [...(groups[label] ?? []), b];
  }

  // Sort groups in natural order
  const order = ["Today", "Tomorrow", "Upcoming"];
  return order.filter((k) => groups[k]).map((k) => ({ label: k, items: groups[k] }));
}

// ─── BookingRow ───────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (b: Booking) => void;
}) {
  return (
    <div className="booking-row">
      <div className="booking-date-col">
        <span className="booking-date">{formatDate(booking.date)}</span>
        <span className="booking-time">
          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
        </span>
      </div>

      <div className="booking-info-col">
        <span className="booking-title">{booking.title}</span>
        <span className="booking-attendee">with {booking.attendee}</span>
      </div>

      {booking.status === "upcoming" && (
        <div className="booking-actions">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" className="icon-btn" title="More options" style={{ padding: 0 }}>
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="dropdown-content" align="end" sideOffset={4}>
                <DropdownMenu.Item className="dropdown-item danger" onSelect={() => onCancel(booking)}>
                  <XCircle size={13} />
                  Cancel booking
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}

      {booking.status === "cancelled" && (
        <span className="booking-cancelled-badge">Cancelled</span>
      )}
    </div>
  );
}

// ─── EmptyTab ─────────────────────────────────────────────────────────────────

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="booking-empty">
      <BookOpen size={28} strokeWidth={1.5} />
      <p>No {label.toLowerCase()} bookings</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingStatus>("upcoming");

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .catch(console.error)
      .finally(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0", color: "var(--ink-muted)" }}>
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b)
        );
      }
    } catch (e) {
      console.error("Failed to cancel booking", e);
    }
    setCancelTarget(null);
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 10);
  };

  // Derive upcoming/past from date at render time so stale DB status never misleads
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.date + "T00:00:00") >= now)
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.date + "T00:00:00") < now)
    .sort((a, b) => b.date.localeCompare(a.date));

  const cancelled = bookings
    .filter((b) => b.status === "cancelled")
    .sort((a, b) => b.date.localeCompare(a.date));

  const upcomingGroups = groupByDate(upcoming);

  const counts: Record<BookingStatus, number> = {
    upcoming: upcoming.length,
    past: past.length,
    cancelled: cancelled.length,
  };

  return (
    <Toast.Provider swipeDirection="right">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Bookings</h1>
          <p>See upcoming and past events booked through your event type links.</p>
        </div>
      </div>

      <div className="page-body">
        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as BookingStatus)}>
          {/* Tab bar */}
          <Tabs.List className="booking-tabs">
            {(["upcoming", "past", "cancelled"] as BookingStatus[]).map((tab) => (
              <Tabs.Trigger key={tab} value={tab} className="booking-tab">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {counts[tab] > 0 && (
                  <span className="booking-tab-count">{counts[tab]}</span>
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Upcoming */}
          <Tabs.Content value="upcoming" className="booking-tab-content">
            {upcoming.length === 0 ? (
              <EmptyTab label="Upcoming" />
            ) : (
              <div className="booking-list">
                {upcomingGroups.map((group) => (
                  <div key={group.label}>
                    <div className="booking-group-label">{group.label}</div>
                    {group.items.map((b) => (
                      <BookingRow key={b.id} booking={b} onCancel={setCancelTarget} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>

          {/* Past */}
          <Tabs.Content value="past" className="booking-tab-content">
            {past.length === 0 ? (
              <EmptyTab label="Past" />
            ) : (
              <div className="booking-list">
                {past.map((b) => (
                  <BookingRow key={b.id} booking={b} onCancel={setCancelTarget} />
                ))}
              </div>
            )}
          </Tabs.Content>

          {/* Cancelled */}
          <Tabs.Content value="cancelled" className="booking-tab-content">
            {cancelled.length === 0 ? (
              <EmptyTab label="Cancelled" />
            ) : (
              <div className="booking-list">
                {cancelled.map((b) => (
                  <BookingRow key={b.id} booking={b} onCancel={setCancelTarget} />
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog.Root open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content" style={{ width: 400 }}>
            <Dialog.Title className="dialog-title">Cancel booking</Dialog.Title>
            <Dialog.Description className="dialog-description">
              Are you sure you want to cancel{" "}
              <strong>{cancelTarget?.title}</strong> with{" "}
              <strong>{cancelTarget?.attendee}</strong>? This cannot be undone.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="dialog-close"><X size={14} /></button>
            </Dialog.Close>
            <div className="dialog-footer">
              <Dialog.Close asChild>
                <Button variant="ghost">Keep booking</Button>
              </Dialog.Close>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
              >
                Yes, cancel it
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Toast.Root className="toast-root" open={toastOpen} onOpenChange={setToastOpen} duration={2500}>
        <Toast.Description>Booking cancelled</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
