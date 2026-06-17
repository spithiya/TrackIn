'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, MapPin, Phone, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import type { Tables } from '@/lib/supabase/types'
import { addLocation, updateLocation, deleteLocation } from './actions'

type Location = Tables<'locations'>

const EMPTY_FORM = {
  name: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  phone: '',
  opens_at: '08:00',
  closes_at: '18:00',
  notes: '',
  is_active: true,
}

export function LocationsClient({ locations }: { locations: Location[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({
      name: loc.name,
      address_street: loc.address_street,
      address_city: loc.address_city,
      address_state: loc.address_state,
      address_zip: loc.address_zip,
      phone: loc.phone ?? '',
      opens_at: loc.opens_at,
      closes_at: loc.closes_at,
      notes: loc.notes ?? '',
      is_active: loc.is_active,
    })
    setError(null)
    setModalOpen(true)
  }

  function set(key: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteLocation(deleteTarget.id)
    setDeleting(false)
    if (result.error) {
      setError(result.error)
    } else {
      setDeleteTarget(null)
      router.refresh()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = editing
        ? await updateLocation(editing.id, form)
        : await addLocation(form)
      if (result.error) {
        setError(result.error)
      } else {
        setModalOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Locations</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} className="mr-1.5" />
          Add Location
        </Button>
      </div>

      {!locations.length ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400 py-12 text-center">
              No locations set up yet. Add your first location to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <Card key={loc.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900">{loc.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant={loc.is_active ? 'green' : 'gray'}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      onClick={() => openEdit(loc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(loc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {loc.address_street}, {loc.address_city}, {loc.address_state} {loc.address_zip}
                    </span>
                  </div>
                  {loc.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Phone size={15} className="text-slate-400 shrink-0" />
                      <span>{loc.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Clock size={15} className="text-slate-400 shrink-0" />
                    <span>{loc.opens_at} – {loc.closes_at}</span>
                  </div>
                </div>

                {loc.notes && (
                  <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-3">{loc.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Location"
      >
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Location' : 'Add Location'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Location name *">
            <div className="relative">
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Main Campus" className={`${inputCls} ${form.name ? 'pr-8' : ''}`} />
              {form.name && <button type="button" onClick={() => set('name', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
            </div>
          </Field>

          <Field label="Street address *">
            <div className="relative">
              <input required value={form.address_street} onChange={e => set('address_street', e.target.value)} placeholder="123 Main St" className={`${inputCls} ${form.address_street ? 'pr-8' : ''}`} />
              {form.address_street && <button type="button" onClick={() => set('address_street', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Field label="City *">
                <div className="relative">
                  <input required value={form.address_city} onChange={e => set('address_city', e.target.value)} placeholder="Springfield" className={`${inputCls} ${form.address_city ? 'pr-8' : ''}`} />
                  {form.address_city && <button type="button" onClick={() => set('address_city', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
                </div>
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="State *">
                <div className="relative">
                  <input required maxLength={2} value={form.address_state} onChange={e => set('address_state', e.target.value.toUpperCase())} placeholder="IL" className={`${inputCls} ${form.address_state ? 'pr-8' : ''}`} />
                  {form.address_state && <button type="button" onClick={() => set('address_state', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
                </div>
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="ZIP *">
                <div className="relative">
                  <input required value={form.address_zip} onChange={e => set('address_zip', e.target.value)} placeholder="62701" className={`${inputCls} ${form.address_zip ? 'pr-8' : ''}`} />
                  {form.address_zip && <button type="button" onClick={() => set('address_zip', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
                </div>
              </Field>
            </div>
          </div>

          <Field label="Phone">
            <div className="relative">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" className={`${inputCls} ${form.phone ? 'pr-8' : ''}`} />
              {form.phone && <button type="button" onClick={() => set('phone', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Opens at *">
              <input
                required
                type="time"
                value={form.opens_at}
                onChange={e => set('opens_at', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Closes at *">
              <input
                required
                type="time"
                value={form.closes_at}
                onChange={e => set('closes_at', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Notes">
            <div className="relative">
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" className={`${inputCls} resize-none ${form.notes ? 'pr-8' : ''}`} />
              {form.notes && <button type="button" onClick={() => set('notes', '')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
            </div>
          </Field>

          {editing && (
            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => set('is_active', e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Active location
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Location'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500'
