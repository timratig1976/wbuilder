'use client'

import { useEffect, useRef, useState } from 'react'
import { useBuilderStore } from '@/lib/store'

const DEBOUNCE_MS = 2000

export function useProjectAutoSave(): { isDirty: boolean } {
  const project = useBuilderStore((s) => s.project)
  const manifest = useBuilderStore((s) => s.manifest)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const bootstrappedRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)

  // ── One-time bootstrap: sync all localStorage projects to server ──────────
  // This ensures projects created before auto-save existed appear in the
  // Topbar "Open" drawer (which reads from server).
  useEffect(() => {
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true

    const { savedProjects } = useBuilderStore.getState()
    if (savedProjects.length === 0) return

    // Fetch the list of IDs already on the server, then POST only truly missing ones.
    // NEVER overwrite a project that already exists on the server —
    // the server version is always authoritative for existing entries.
    fetch('/api/projects')
      .then((r) => r.json())
      .then((serverList: Array<{ id: string }>) => {
        const serverIds = new Set(serverList.map((p) => p.id))
        const missing = savedProjects.filter((p) => {
          const hasSections = p.pages.some((pg) => pg.sections.length > 0)
          // Only upload if: (a) not on server AND (b) has real content
          return !serverIds.has(p.id) && (hasSections || p.manifest)
        })
        missing.forEach((p) => {
          fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          }).catch(() => { /* silent */ })
        })
      })
      .catch(() => { /* server not available — skip bootstrap */ })
  }, [])

  // ── Ongoing debounced save on every project/manifest change ──────────────
  useEffect(() => {
    const hasSections = project.pages.some((p) => p.sections.length > 0)
    if (!hasSections && !manifest) return

    const payload = { ...project, manifest: manifest ?? project.manifest }
    const serialized = JSON.stringify(payload)

    if (serialized === lastSavedRef.current) return

    setIsDirty(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: serialized,
        })
        if (res.ok) { lastSavedRef.current = serialized; setIsDirty(false) }
      } catch { /* silent — localStorage is still the fallback */ }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [project, manifest])

  return { isDirty }
}
