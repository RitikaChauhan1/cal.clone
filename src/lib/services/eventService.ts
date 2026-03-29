import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function getEventTypes() {
  return prisma.eventType.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEventTypeBySlug(slug: string) {
  return prisma.eventType.findUnique({
    where: { slug }
  });
}

export async function createEventType(data: Pick<Prisma.EventTypeCreateInput, "title" | "description" | "duration" | "slug">) {
  let finalSlug = data.slug;
  let isUnique = false;
  let counter = 1;

  while (!isUnique) {
    const existing = await prisma.eventType.findUnique({
      where: { slug: finalSlug },
    });
    if (!existing) {
      isUnique = true;
    } else {
      finalSlug = `${data.slug}-${counter}`;
      counter++;
    }
  }

  return prisma.eventType.create({
    data: {
      ...data,
      slug: finalSlug,
      isActive: true,
    },
  });
}

export async function updateEventType(id: string, data: Prisma.EventTypeUpdateInput) {
  // If slug is updated, uniqueness logic should apply, but simplifying for now.
  return prisma.eventType.update({
    where: { id },
    data,
  });
}

export async function deleteEventType(id: string) {
  return prisma.eventType.delete({
    where: { id },
  });
}
