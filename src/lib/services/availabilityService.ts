import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function getAvailabilityProfiles() {
  return prisma.availabilityProfile.findMany({
    include: { slots: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getDefaultAvailability() {
  const profile = await prisma.availabilityProfile.findFirst({
    where: { isDefault: true },
    include: { slots: true },
  });

  if (!profile) return null;

  // Format slots into UI-friendly structure
  const days: Record<string, any> = {
    Sunday: { enabled: false, start: "09:00", end: "17:00" },
    Monday: { enabled: false, start: "09:00", end: "17:00" },
    Tuesday: { enabled: false, start: "09:00", end: "17:00" },
    Wednesday: { enabled: false, start: "09:00", end: "17:00" },
    Thursday: { enabled: false, start: "09:00", end: "17:00" },
    Friday: { enabled: false, start: "09:00", end: "17:00" },
    Saturday: { enabled: false, start: "09:00", end: "17:00" },
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  profile.slots.forEach((slot: any) => {
    if (slot.isActive) {
      const name = dayNames[slot.dayOfWeek];
      days[name] = {
        enabled: true,
        start: slot.startTime,
        end: slot.endTime
      };
    }
  });

  return {
    id: profile.id,
    timezone: profile.timezone,
    days
  };
}

// Complex creation wrapped
export async function createAvailabilityProfile(
  name: string,
  timezone: string,
  isDefault: boolean,
  daysRecord: Record<string, { enabled: boolean; start: string; end: string }>
) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  if (isDefault) {
    await prisma.availabilityProfile.updateMany({
      data: { isDefault: false }
    });
  }

  return prisma.availabilityProfile.create({
    data: {
      name,
      timezone,
      isDefault,
      slots: {
        create: Object.entries(daysRecord)
          .filter(([, schedule]) => schedule.enabled)
          .map(([dayName, schedule]) => ({
            dayOfWeek: dayNames.indexOf(dayName),
            startTime: schedule.start,
            endTime: schedule.end,
            isActive: true
          }))
      }
    },
    include: { slots: true }
  });
}
