"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, Clock } from "lucide-react";

const NAV_ITEMS = [
  { href: "/event-types", label: "Event types", icon: CalendarDays },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/availability", label: "Availability", icon: Clock },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-avatar">A</div>
        <span className="sidebar-user-name">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item${isActive ? " active" : ""}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
