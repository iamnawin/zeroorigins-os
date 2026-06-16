import 'server-only'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ZeroOrigins <noreply@zeroorigins.in>'

export interface MeetingEmailInput {
  title: string
  scheduled_at: string
  duration_minutes: number
  attendees: string[]
  agenda: string | null
  meeting_link: string | null
  organizer_name?: string
}

export async function sendMeetingNotification(input: MeetingEmailInput) {
  if (!resend || !input.attendees.length) return

  const date = new Date(input.scheduled_at)
  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const subject = `Meeting: ${input.title} — ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  const lines = [
    `<h2 style="margin:0 0 16px">${input.title}</h2>`,
    `<p><strong>When:</strong> ${formattedDate}</p>`,
    `<p><strong>Duration:</strong> ${input.duration_minutes} minutes</p>`,
    input.organizer_name ? `<p><strong>Organizer:</strong> ${input.organizer_name}</p>` : '',
    input.agenda ? `<p><strong>Agenda:</strong> ${input.agenda}</p>` : '',
    input.meeting_link ? `<p><a href="${input.meeting_link}">Join Meeting</a></p>` : '',
    `<hr style="margin:16px 0;border:none;border-top:1px solid #333"/>`,
    `<p style="color:#888;font-size:12px">Sent from ZeroOrigins OS</p>`,
  ].filter(Boolean).join('\n')

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.attendees,
      subject,
      html: lines,
    })
  } catch {
    // Email send failure should not block meeting creation
    console.error('[email] Failed to send meeting notification')
  }
}
