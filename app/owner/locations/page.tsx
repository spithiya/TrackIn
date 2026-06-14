import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock } from 'lucide-react'

export default async function OwnerLocationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name')

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">Locations</h1>

      {!locations?.length ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400 py-12 text-center">
              No locations set up yet. Contact your administrator to add locations.
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
                  <Badge variant={loc.is_active ? 'green' : 'gray'}>
                    {loc.is_active ? 'Active' : 'Inactive'}
                  </Badge>
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
    </div>
  )
}
