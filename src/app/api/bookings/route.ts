import { NextResponse } from 'next/server';
import { getBookingsForDate, createBooking } from '@/lib/services/bookingService';
import { createBookingSchema } from '@/lib/validations/bookingSchema';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmation } from '@/lib/email';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const eventTypeId = searchParams.get('eventTypeId');

    // No params — return all bookings for the dashboard
    if (!date || !eventTypeId) {
      const all = await prisma.booking.findMany({
        include: { eventType: { select: { title: true } } },
        orderBy: { date: 'asc' },
      });
      return NextResponse.json({
        bookings: all.map((b) => ({
          id: b.id,
          title: b.eventType.title,
          attendee: b.name,
          email: b.email,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status.toLowerCase(),
        })),
      });
    }

    const bookings = await getBookingsForDate(eventTypeId, date);
    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request using Zod
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error.issues[0].message 
      }, { status: 400 });
    }

    const newBooking = await createBooking(validation.data);

    // Fetch event title for the email
    const eventType = await prisma.eventType.findUnique({
      where: { id: validation.data.eventTypeId },
      select: { title: true },
    });

    // Send confirmation email — non-blocking, failure does not affect response
    sendBookingConfirmation(validation.data.email, {
      name: validation.data.name,
      eventTitle: eventType?.title ?? 'Meeting',
      startTime: validation.data.startTime,
      endTime: validation.data.endTime,
      date: validation.data.date,
    }).catch((err) => console.error('Failed to send confirmation email:', err));

    return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
    
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    
    // Map overlapping or constraints into 400
    if (error?.message?.includes('overlaps') || error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'This time slot is already booked' }, { status: 400 });
    }
    
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
  }
}
