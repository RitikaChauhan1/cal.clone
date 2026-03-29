import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  context: any // ✅ FIX: do NOT type params manually
) {
  try {
    const id = context.params.id;

    const body = await req.json();
    const { name, timezone, isDefault, days } = body;

    if (isDefault) {
      await prisma.availabilityProfile.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedProfile = await prisma.availabilityProfile.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: { slots: true },
    });

    if (days) {
      for (const [dayStr, schedule] of Object.entries(days)) {
        const dayOfWeek = parseInt(dayStr);

        const { start, end, enabled } = schedule as {
          start: string;
          end: string;
          enabled: boolean;
        };

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
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: any // ✅ FIX HERE ALSO
) {
  try {
    const id = context.params.id;

    const profile = await prisma.availabilityProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    await prisma.availabilityProfile.delete({
      where: { id },
    });

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
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
