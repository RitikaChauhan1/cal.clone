import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBookingCancellation } from '@/lib/email';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch before update to get email + event title for the notification
    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: { select: { title: true } } },
    });

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Send cancellation email — non-blocking
    if (existing) {
      sendBookingCancellation(existing.email, {
        name: existing.name,
        eventTitle: existing.eventType.title,
        startTime: existing.startTime,
        endTime: existing.endTime,
        date: existing.date,
      }).catch((err) => console.error('Failed to send cancellation email:', err));
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Failed to update booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
