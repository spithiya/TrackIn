import { cookies } from 'next/headers'

const COOKIE = 'bm_loc_filter'

export async function getLocationFilter(): Promise<string[]> {
  const store = await cookies()
  const val = store.get(COOKIE)?.value
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
