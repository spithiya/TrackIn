'use server'

import { cookies } from 'next/headers'

export async function saveLocationFilter(locationIds: string[]) {
  const store = await cookies()
  store.set('bm_loc_filter', JSON.stringify(locationIds), {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
}
