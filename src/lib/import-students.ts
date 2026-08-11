export type ParsedSubjects = 'math' | 'reading' | 'both'

export interface ImportRow {
  rowNumber: number
  firstName: string
  lastName: string
  subjectsRaw: string
  subjects: ParsedSubjects | null
  phone: string | null
  phoneRaw: string
  errors: string[]
  duplicate: boolean
}

const HEADER_ALIASES = {
  firstName: ['first name', 'firstname', 'first'],
  lastName: ['last name', 'lastname', 'last'],
  subjects: ['subject', 'subjects'],
  phone: ['phone num', 'phone number', 'phone', 'phone#', 'parent phone'],
} as const

function normalizeHeader(h: string) {
  return h.trim().toLowerCase()
}

function findColumn(headers: string[], aliases: readonly string[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias)
    if (idx !== -1) return idx
  }
  return -1
}

export function toTitleCase(s: string): string {
  return s.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export function parseSubjects(raw: string): ParsedSubjects | null {
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (v === 'math') return 'math'
  if (v === 'reading') return 'reading'
  const normalized = v.replace(/[-/+]| and /g, ' ').replace(/\s+/g, ' ').trim()
  if (normalized === 'both') return 'both'
  const hasMath = /\bmath\b/.test(normalized)
  const hasReading = /\breading\b/.test(normalized)
  if (hasMath && hasReading) return 'both'
  if (hasMath) return 'math'
  if (hasReading) return 'reading'
  return null
}

// Accepts: 1234567890, 123-456-7890, 123 456 7890, (123) 456-7890,
// (123)456-7890, (123) 456 7890, and similar mixes of those separators.
const PHONE_PATTERN = /^\(?(\d{3})\)?[-\s]?(\d{3})[-\s]?(\d{4})$/

export function normalizePhone(raw: string): string | null {
  const match = raw.trim().match(PHONE_PATTERN)
  if (!match) return null
  return `${match[1]}${match[2]}${match[3]}`
}

export function buildImportRows(
  allRows: string[][],
  existingNames: Set<string>
): { headerError: string | null; rows: ImportRow[] } {
  const nonEmptyRows = allRows.filter(r => r.some(c => c && c.trim()))
  if (nonEmptyRows.length === 0) {
    return { headerError: 'The sheet appears to be empty.', rows: [] }
  }

  const header = nonEmptyRows[0]
  const firstNameIdx = findColumn(header, HEADER_ALIASES.firstName)
  const lastNameIdx = findColumn(header, HEADER_ALIASES.lastName)
  const subjectsIdx = findColumn(header, HEADER_ALIASES.subjects)
  const phoneIdx = findColumn(header, HEADER_ALIASES.phone)

  const missing: string[] = []
  if (firstNameIdx === -1) missing.push('First Name')
  if (lastNameIdx === -1) missing.push('Last Name')
  if (subjectsIdx === -1) missing.push('Subject(s)')
  if (phoneIdx === -1) missing.push('Phone Num')
  if (missing.length > 0) {
    return {
      headerError: `Missing required column(s): ${missing.join(', ')}. Check the template — the first row must have these exact headers.`,
      rows: [],
    }
  }

  const rows: ImportRow[] = []
  for (let i = 1; i < nonEmptyRows.length; i++) {
    const raw = nonEmptyRows[i]

    const firstNameRaw = (raw[firstNameIdx] ?? '').trim()
    const lastNameRaw = (raw[lastNameIdx] ?? '').trim()
    const subjectsRaw = (raw[subjectsIdx] ?? '').trim()
    const phoneRaw = (raw[phoneIdx] ?? '').trim()

    const firstName = toTitleCase(firstNameRaw)
    const lastName = toTitleCase(lastNameRaw)
    const subjects = parseSubjects(subjectsRaw)
    const phone = normalizePhone(phoneRaw)

    const errors: string[] = []
    if (!firstNameRaw) errors.push('Missing first name')
    if (!lastNameRaw) errors.push('Missing last name')
    if (!subjects) errors.push(`Invalid subjects ("${subjectsRaw || 'blank'}")`)
    if (!phone) errors.push(phoneRaw ? `Invalid phone format ("${phoneRaw}")` : 'Missing phone number')

    const duplicate = !!firstNameRaw && !!lastNameRaw &&
      existingNames.has(`${firstName.toLowerCase()}|${lastName.toLowerCase()}`)

    rows.push({
      rowNumber: i + 1,
      firstName,
      lastName,
      subjectsRaw,
      subjects,
      phone,
      phoneRaw,
      errors,
      duplicate,
    })
  }

  return { headerError: null, rows }
}

/** Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes, embedded commas/newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += char; i++; continue
    }
    if (char === '"') { inQuotes = true; i++; continue }
    if (char === ',') { row.push(field); field = ''; i++; continue }
    if (char === '\r') { i++; continue }
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
    field += char; i++
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  return rows
}
