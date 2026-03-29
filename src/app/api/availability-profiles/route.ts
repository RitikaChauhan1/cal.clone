import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const profiles = await prisma.availabilityProfile.findMany({
      include: { slots: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Failed to fetch availability profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, timezone } = await req.json();

    // If it's the very first profile, make it default automatically
    const count = await prisma.availabilityProfile.count();
    const isDefault = count === 0;

    const newProfile = await prisma.availabilityProfile.create({
      data: {
        name: name || 'Working hours',
        timezone: timezone || 'Asia/Kolkata',
        isDefault,
        slots: {
          create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
            // Active Monday(1) to Friday(5)
            isActive: dayOfWeek >= 1 && dayOfWeek <= 5,
          })),
        },
      },
      include: { slots: true },
    });

    return NextResponse.json(newProfile);
  } catch (error) {
    console.error('Failed to create availability profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
