export async function exportTimesheetToSheets(
  rows: { staffName: string; date: string; checkIn: string; checkOut: string; hours: string }[],
  locationName: string,
  period: string
) {
  // Dynamic import keeps googleapis out of the webpack bundle
  const { google } = await import('googleapis')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const title = `${locationName} Timesheet — ${period}`
  const headers = ['Staff Name', 'Date', 'Check In', 'Check Out', 'Hours']
  const values = [headers, ...rows.map(r => [r.staffName, r.date, r.checkIn, r.checkOut, r.hours])]

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Timesheet' } }],
    },
  })

  const spreadsheetId = spreadsheet.data.spreadsheetId!

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Timesheet!A1',
    valueInputOption: 'RAW',
    requestBody: { values },
  })

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
}
