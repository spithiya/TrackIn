'use client'

import { useState } from 'react'

export function useLocationFilter() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  return { selectedLocationId, setSelectedLocationId }
}
