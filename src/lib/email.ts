import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'TrackIn <onboarding@resend.dev>'

function client() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

// Sends the username(s) tied to one real email address — an owner running
// multiple locations can have more than one account under the same email,
// so this always lists all of them rather than assuming just one.
export async function sendUsernameReminderEmail(to: string, usernames: string[]): Promise<{ error?: string }> {
  const resend = client()
  if (!resend) return { error: 'Email sending is not configured.' }

  const list = usernames.map(u => `<li style="margin:4px 0"><strong>${u}</strong></li>`).join('')
  const plainList = usernames.map(u => `- ${u}`).join('\n')

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: usernames.length > 1 ? 'Your TrackIn usernames' : 'Your TrackIn username',
    html: `
      <p>Here ${usernames.length > 1 ? 'are the usernames' : 'is the username'} associated with this email address on TrackIn:</p>
      <ul>${list}</ul>
      <p>You can sign in with ${usernames.length > 1 ? 'any of these' : 'this'} at any time.</p>
      <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
    `,
    text: `Here ${usernames.length > 1 ? 'are the usernames' : 'is the username'} associated with this email address on TrackIn:\n\n${plainList}\n\nIf you didn't request this, you can safely ignore this email.`,
  })

  if (error) return { error: error.message }
  return {}
}
