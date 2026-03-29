import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await req.json();
    const { name, timezone, isDefault, days } = body;

    // Optional constraint: Only one profile can be default
    if (isDefault) {
      await prisma.availabilityProfile.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Update Profile headers
    let updatedProfile = await prisma.availabilityProfile.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: { slots: true },
    });

    // Update slots if provided (days map mapping dayOfWeek(number) -> schedule)
    if (days) {
      for (const [dayStr, schedule] of Object.entries(days)) {
        const dayOfWeek = parseInt(dayStr);
        const { start, end, enabled } = schedule as { start: string, end: string, enabled: boolean };
        await prisma.availabilitySlot.upsert({
          where: {
            availabilityProfileId_dayOfWeek: {
              availabilityProfileId: updatedProfile.id,
              dayOfWeek,
            },
          },
          create: {
            availabilityProfileId: updatedProfile.id,
            dayOfWeek,
            startTime: start,
            endTime: end,
            isActive: enabled,
          },
          update: {
            startTime: start,
            endTime: end,
            isActive: enabled,
          },
        });
      }
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Failed to update availability profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await Promise.resolve(params);

    const profile = await prisma.availabilityProfile.findUnique({
      where: { id },
    });

    if (!profile) {
       return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    await prisma.availabilityProfile.delete({
      where: { id },
    });

    // Strategy if they delete the default: assign another default if others exist.
    if (profile.isDefault) {
      const remaining = await prisma.availabilityProfile.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (remaining) {
        await prisma.availabilityProfile.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete availability profile:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
