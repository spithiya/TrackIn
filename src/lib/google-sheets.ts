function getGoogleAuth() {
  // In development, GOOGLE_APPLICATION_CREDENTIALS points to the JSON key file directly.
  // In production (Vercel), use GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY env vars.
  return import('googleapis').then(({ google }) => new google.auth.GoogleAuth(
    process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? {
          scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
          ],
        }
      : {
          credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
          ],
        }
  ))
}

export async function exportTimesheetToSheets(
  rows: { staffName: string; date: string; checkIn: string; checkOut: string; hours: string }[],
  locationName: string,
  period: string
) {
  const { google } = await import('googleapis')
  const auth = await getGoogleAuth()

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

function extractSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : urlOrId.trim()
}

/**
 * Reads all cell values from the first sheet/tab of a Google Sheet as raw
 * strings, using the app's existing service account. The owner must share
 * the sheet with the service account's email (Viewer is enough) — this
 * keeps student/parent data private rather than requiring a public link.
 */
export async function readSheetRows(urlOrId: string): Promise<string[][]> {
  const { google } = await import('googleapis')
  const auth = await getGoogleAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const spreadsheetId = extractSpreadsheetId(urlOrId)

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Z5000',
  })

  return (res.data.values ?? []).map(row => row.map(cell => String(cell ?? '')))
}

export async function getServiceAccountEmail(): Promise<string | null> {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyPath) return null
  try {
    const { readFile } = await import('fs/promises')
    const key = JSON.parse(await readFile(keyPath, 'utf8'))
    return key.client_email ?? null
  } catch {
    return null
  }
}
