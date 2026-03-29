import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, duration, slug, isActive } = body;

    // Build update data handling partial updates (like just isActive toggle)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = Number(duration);
    if (isActive !== undefined) updateData.isActive = isActive;

    if (slug !== undefined) {
      let finalSlug = slug;
      let isUnique = false;
      let counter = 1;

      while (!isUnique) {
        const existing = await prisma.eventType.findFirst({
          where: { 
            slug: finalSlug,
            NOT: { id }
          },
        });
        if (!existing) {
          isUnique = true;
        } else {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
      }
      updateData.slug = finalSlug;
    }

    const updatedEventType = await prisma.eventType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEventType);
  } catch (error) {
    console.error('Error updating event type:', error);
    return NextResponse.json({ error: 'Failed to update event type' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    
    await prisma.eventType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event type:', error);
    return NextResponse.json({ error: 'Failed to delete event type' }, { status: 500 });
  }
}
