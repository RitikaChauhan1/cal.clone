"use client";

import { useState, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Toast from "@radix-ui/react-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreHorizontal, Calendar, Clock, XCircle, X, BookOpen } from "lucide-react";
import type { Booking, BookingStatus } from "@/types";

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_BOOKINGS: Booking[] = [
  {
    id: "b1",
    title: "30 min meeting",
    attendee: "Priya Sharma",
    date: "2026-04-02",
    startTime: "10:00",
    endTime: "10:30",
    status: "upcoming",
  },
  {
    id: "b2",
    title: "Quick sync",
    attendee: "Arjun Mehta",
    date: "2026-04-05",
    startTime: "14:00",
    endTime: "14:15",
    status: "upcoming",
  },
  {
    id: "b3",
    title: "30 min meeting",
    attendee: "Sara Khan",
    date: "2026-03-20",
    startTime: "11:00",
    endTime: "11:30",
    status: "past",
  },
  {
    id: "b4",
    title: "Quick sync",
    attendee: "Rohan Verma",
    date: "2026-03-15",
    startTime: "09:00",
    endTime: "09:15",
    status: "past",
  },
];

const STORAGE_KEY = "cal_bookings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr}${ampm}`;
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
              <button className="icon-btn" title="More options">
                <MoreHorizontal size={14} />
              </button>
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

  // Confirm cancel dialog
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  // Toast
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setBookings(raw ? JSON.parse(raw) : SEED_BOOKINGS);
    } catch {
      setBookings(SEED_BOOKINGS);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings, hydrated]);

  if (!hydrated) return null;

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    setBookings((prev) =>
      prev.map((b) => b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b)
    );
    setCancelTarget(null);
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 10);
  };

  const upcoming = bookings.filter((b) => b.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date));
  const past = bookings.filter((b) => b.status === "past").sort((a, b) => b.date.localeCompare(a.date));
  const cancelled = bookings.filter((b) => b.status === "cancelled").sort((a, b) => b.date.localeCompare(a.date));

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
                <button className="btn btn-ghost">Keep booking</button>
              </Dialog.Close>
              <button
                className="btn"
                style={{ background: "var(--danger)", color: "#fff" }}
                onClick={handleConfirmCancel}
              >
                Yes, cancel it
              </button>
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
