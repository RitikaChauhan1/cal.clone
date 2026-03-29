import { NextResponse } from 'next/server';
import { getEventTypes, createEventType } from '@/lib/services/eventService';
import { createEventTypeSchema } from '@/lib/validations/eventSchema';

export async function GET() {
  try {
    const eventTypes = await getEventTypes();
    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch event types' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Native strict validations against payload injections
    const validation = createEventTypeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error.issues[0].message 
      }, { status: 400 });
    }

    const newEventType = await createEventType(validation.data);
    return NextResponse.json({ success: true, data: newEventType }, { status: 201 });
  } catch (error) {
    console.error('Error creating event type:', error);
    return NextResponse.json({ success: false, error: 'Failed to create event type' }, { status: 500 });
  }
}
