'use client'

import { useEffect, useRef } from 'react'
import { useBuilderStore } from '@/lib/store'

const DEBOUNCE_MS = 2000

export function useProjectAutoSave() {
  const project = useBuilderStore((s) => s.project)
  const manifest = useBuilderStore((s) => s.manifest)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    // Skip if no meaningful content yet
    const hasSections = project.pages.some((p) => p.sections.length > 0)
    if (!hasSections && !manifest) return

    // Build the full payload — project + manifest merged
    const payload = { ...project, manifest: manifest ?? project.manifest }
    const serialized = JSON.stringify(payload)

    // Skip if nothing changed since last save
    if (serialized === lastSavedRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: serialized,
        })
        if (res.ok) lastSavedRef.current = serialized
      } catch { /* silent — localStorage is still the fallback */ }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [project, manifest])
}
