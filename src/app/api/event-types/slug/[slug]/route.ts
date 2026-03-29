import { NextResponse } from 'next/server';
import { getEventTypeBySlug, updateEventType, deleteEventType } from '@/lib/services/eventService';

// Extract param strictly
export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const eventType = await getEventTypeBySlug(params.slug);
    if (!eventType) {
      return NextResponse.json({ success: false, message: 'Event type not found' }, { status: 404 });
    }
    return NextResponse.json(eventType);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch event type' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json();
    const updated = await updateEventType(params.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update event type' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await deleteEventType(params.id);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete event type' }, { status: 500 });
  }
}
