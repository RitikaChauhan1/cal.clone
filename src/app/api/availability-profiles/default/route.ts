import { NextResponse } from 'next/server';
import { getDefaultAvailability } from '@/lib/services/availabilityService';

export async function GET() {
  try {
    const defaultProfile = await getDefaultAvailability();

    if (!defaultProfile) {
      return NextResponse.json({ success: false, error: 'No default availability found' }, { status: 404 });
    }

    // Notice we return directly to preserve existing Booking API expectations structurally, 
    // or wrap inside `{ success: true, data: defaultProfile }`.
    // Returning raw defaultProfile structure directly since BookingPageClient expects it.
    return NextResponse.json(defaultProfile);
  } catch (error) {
    console.error('Error fetching default availability:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
