export interface EventType {
  id: string;
  title: string;
  duration: number;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export type BookingStatus = "upcoming" | "past" | "cancelled";

export interface Booking {
  id: string;
  title: string;
  attendee: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
}
