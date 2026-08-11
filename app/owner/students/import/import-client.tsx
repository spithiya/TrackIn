'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { ArrowLeft, Download, Upload, Link as LinkIcon, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { buildImportRows, parseCsv, type ImportRow } from '@/lib/import-students'
import { bulkImportStudents } from './actions'

type Location = { id: string; name: string }
type ToastState = { message: string; variant: 'green' | 'amber' | 'red' } | null

export function ImportStudentsClient({
  locations,
  existingNames,
}: {
  locations: Location[]
  existingNames: string[]
}) {
  const router = useRouter()
  const existingNameSet = useMemo(() => new Set(existingNames), [existingNames])

  const [locationId, setLocationId] = useState(locations.length === 1 ? locations[0].id : '')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [serviceEmail, setServiceEmail] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/import/sheet').then(r => r.json()).then(d => setServiceEmail(d.email ?? null)).catch(() => {})
  }, [])

  function applyRows(allRows: string[][], sourceLabel: string) {
    const { headerError, rows } = buildImportRows(allRows, existingNameSet)
    setHeaderError(headerError)
    setRows(headerError ? [] : rows)
    setSource(sourceLabel)
    if (headerError) setToast({ message: headerError, variant: 'red' })
  }

  async function handleFile(file: File) {
    setParsing(true)
    setHeaderError(null)
    setRows([])
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text()
        applyRows(parseCsv(text), file.name)
      } else {
        const ExcelJS = (await import('exceljs')).default
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(await file.arrayBuffer())
        const ws = wb.worksheets[0]
        const allRows: string[][] = []
        ws.eachRow(row => {
          const cells: string[] = []
          row.eachCell({ includeEmpty: true }, cell => {
            cells.push(cell.text ?? '')
          })
          allRows.push(cells)
        })
        applyRows(allRows, file.name)
      }
    } catch {
      setToast({ message: 'Could not read that file. Make sure it\'s a valid .xlsx or .csv file.', variant: 'red' })
    }
    setParsing(false)
  }

  async function handleSheetImport() {
    if (!sheetUrl.trim()) return
    setParsing(true)
    setHeaderError(null)
    setRows([])
    try {
      const res = await fetch('/api/import/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error ?? 'Could not read that sheet.', variant: 'red' })
      } else {
        applyRows(data.rows ?? [], 'Google Sheet')
      }
    } catch {
      setToast({ message: 'Could not reach the sheet import service.', variant: 'red' })
    }
    setParsing(false)
  }

  async function downloadTemplate() {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Students')
    ws.addRow(['First Name', 'Last Name', 'Subject', 'Phone Num'])
    ws.addRow(['Jane', 'Smith', 'Math-Reading', '555-123-4567'])
    ws.addRow(['Alex', 'Doe', 'Math', '555-987-6543'])
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brightmind-student-import-template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const readyRows = rows.filter(r => r.errors.length === 0)
  const errorRows = rows.filter(r => r.errors.length > 0)
  const duplicateCount = readyRows.filter(r => r.duplicate).length

  async function handleImport() {
    if (!locationId || readyRows.length === 0) return
    setImporting(true)
    const result = await bulkImportStudents(
      locationId,
      readyRows.map(r => ({
        firstName: r.firstName,
        lastName: r.lastName,
        subjects: r.subjects!,
        phone: r.phone!,
      }))
    )
    setImporting(false)
    if (result.error) {
      setToast({ message: result.error, variant: 'red' })
    } else {
      setToast({ message: `Imported ${result.imported} student${result.imported === 1 ? '' : 's'}.`, variant: 'green' })
      setTimeout(() => router.push('/owner/students'), 1200)
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/owner/students" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Import Students</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>1. Location</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">
            Every student in this import will be registered at the location you choose here.
          </p>
          {locations.length === 0 ? (
            <p className="text-sm text-amber-600">No locations found. Add a location first.</p>
          ) : (
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
            >
              <option value="">Select a location…</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>2. Spreadsheet</CardTitle>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-[#3D4A5C] hover:text-[#252E3D] font-medium transition-colors"
            >
              <Download size={14} />
              Download template
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-slate-500">
            The first row must have these exact headers (any capitalization works):{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">First Name</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">Last Name</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">Subject</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">Phone Num</span>.
            Subject should be <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">Math</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">Reading</span>, or{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">Math-Reading</span>. Phone numbers can
            be written as <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">1234567890</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">123-456-7890</span>,{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">123 456 7890</span>, or{' '}
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">(123) 456-7890</span>.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload a file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#ECEEF1] file:text-[#3D4A5C] file:font-medium hover:file:bg-[#DEE1E6] file:cursor-pointer cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Import from Google Sheets</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D4A5C]"
                />
              </div>
              <Button size="md" variant="secondary" onClick={handleSheetImport} disabled={!sheetUrl.trim() || parsing}>
                Fetch
              </Button>
            </div>
            {serviceEmail && (
              <p className="text-xs text-slate-400 mt-1.5">
                Share the sheet (Viewer is enough) with <span className="font-mono">{serviceEmail}</span> first.
              </p>
            )}
          </div>

          {parsing && <p className="text-sm text-slate-400">Reading spreadsheet…</p>}
        </CardContent>
      </Card>

      {rows.length > 0 && !headerError && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>3. Review — {source}</CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle2 size={13} /> {readyRows.length} ready
                </span>
                {errorRows.length > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle size={13} /> {errorRows.length} error{errorRows.length === 1 ? '' : 's'}
                  </span>
                )}
                {duplicateCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle size={13} /> {duplicateCount} possible duplicate{duplicateCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#ECEEF1]">
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-2.5 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Row</th>
                    <th className="text-left px-4 py-2.5 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-2.5 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Subjects</th>
                    <th className="text-left px-4 py-2.5 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-2.5 text-[#3D4A5C] font-medium text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.rowNumber} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{r.rowNumber}</td>
                      <td className="px-4 py-2.5 text-slate-900">{r.firstName || '—'} {r.lastName}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.subjects ?? (r.subjectsRaw || '—')}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono">{r.phone ?? (r.phoneRaw || '—')}</td>
                      <td className="px-4 py-2.5">
                        {r.errors.length > 0 ? (
                          <span className="text-red-600 text-xs">{r.errors.join('; ')}</span>
                        ) : r.duplicate ? (
                          <span className="text-amber-600 text-xs">Possible duplicate</span>
                        ) : (
                          <span className="text-green-700 text-xs">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && !headerError && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleImport}
            disabled={!locationId || readyRows.length === 0 || importing}
          >
            <Upload size={15} className="mr-1.5" />
            {importing ? 'Importing…' : `Import ${readyRows.length} Student${readyRows.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}
    </div>
  )
}
