export async function exportTimesheetToSheets(
  rows: { staffName: string; date: string; checkIn: string; checkOut: string; hours: string }[],
  locationName: string,
  period: string
) {
  const { google } = await import('googleapis')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const drive = google.drive({ version: 'v3', auth })

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

  // Make the sheet accessible to anyone with the link
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: { type: 'anyone', role: 'reader' },
  })

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
}
