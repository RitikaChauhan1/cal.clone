import { prisma } from '@/lib/prisma';
import { parseISO, isBefore, isAfter, isEqual } from 'date-fns';

export async function getBookingsForDate(eventTypeId: string, dateStr: string) {
  return prisma.booking.findMany({
    where: {
      eventTypeId,
      date: dateStr,
      status: { not: 'CANCELLED' }
    },
    select: {
      startTime: true,
      endTime: true,
    }
  });
}

export async function createBooking(data: {
  eventTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  email: string;
  name: string;
}) {
  const newStart = parseISO(data.startTime);
  const newEnd = parseISO(data.endTime);

  // Validate bounds memory logic centrally in the service layer
  if (!isBefore(newStart, newEnd)) {
    throw new Error('Invalid time selection bounds');
  }

  const existingBookings = await prisma.booking.findMany({
    where: {
      eventTypeId: data.eventTypeId,
      date: data.date,
      status: { not: 'CANCELLED' }
    }
  });

  for (const b of existingBookings) {
    const existingStart = parseISO(b.startTime);
    const existingEnd = parseISO(b.endTime);

    const overlaps = 
      (isBefore(newStart, existingEnd) && isAfter(newEnd, existingStart)) ||
      (isEqual(newStart, existingStart) && isEqual(newEnd, existingEnd));

    if (overlaps) {
      throw new Error('This time slot overlaps with an existing booking');
    }
  }

  // Insert natively relying on the @@unique database constraints
  return prisma.booking.create({
    data: {
      eventTypeId: data.eventTypeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      email: data.email,
      name: data.name,
      status: 'UPCOMING',
    }
  });
}
