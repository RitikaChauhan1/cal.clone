import { Resend } from 'resend';
import { format } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'Cal Admin <onboarding@resend.dev>';

function buildTimeLabel(startISO: string, endISO: string, date: string): string {
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const startLabel = format(new Date(startISO), 'h:mm aaa');
  const endLabel = format(new Date(endISO), 'h:mm aaa');
  return `${dateLabel}, ${startLabel} – ${endLabel}`;
}

interface BookingEmailData {
  name: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  date: string;
}

export async function sendBookingConfirmation(to: string, data: BookingEmailData) {
  const timeLabel = buildTimeLabel(data.startTime, data.endTime, data.date);
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Booking confirmed: ${data.eventTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:4px;">You're booked!</h2>
        <p>Hi ${data.name},</p>
        <p>Your booking for <strong>${data.eventTitle}</strong> has been confirmed.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0;font-size:15px;"><strong>📅 ${timeLabel}</strong></p>
        </div>
        <p style="color:#666;font-size:13px;">If you need to cancel, please contact us.</p>
      </div>
    `,
  });
}

export async function sendBookingCancellation(to: string, data: BookingEmailData) {
  const timeLabel = buildTimeLabel(data.startTime, data.endTime, data.date);
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Booking cancelled: ${data.eventTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:4px;">Booking cancelled</h2>
        <p>Hi ${data.name},</p>
        <p>Your booking for <strong>${data.eventTitle}</strong> has been cancelled.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0;font-size:15px;"><strong>📅 ${timeLabel}</strong></p>
        </div>
        <p style="color:#666;font-size:13px;">Feel free to book a new slot anytime.</p>
      </div>
    `,
  });
}
