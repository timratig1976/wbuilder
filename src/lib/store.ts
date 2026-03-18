import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { SiteManifest } from './types/manifest'
import { BriefingData, BriefingPreset, PresetSlot } from './types/briefing'
export type { BriefingData, BriefingPreset, PresetSlot } from './types/briefing'

export type SectionType =
  | 'navbar'
  | 'hero'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'stats'
  | 'cta'
  | 'faq'
  | 'footer'
  | 'custom'

export interface Section {
  id: string
  type: SectionType
  label: string
  html: string
  prompt: string
  generating: boolean
  forceRender?: boolean  // Set true when section is added to force initial canvas render
}

export interface Page {
  id: string
  title: string
  slug: string
  prompt: string
  sections: Section[]
  createdAt: number
  updatedAt: number
}

export interface BrandStyle {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  highlightColor: string
  backgroundColor: string
  surfaceColor: string
  darkColor: string
  textColor: string
  textMutedColor: string
  fontFamily: string
  fontBody: string
  headingWeight: string
  borderRadius: string
  tone: string
  extraNotes: string
}

export interface Project {
  id: string
  name: string
  brand: BrandStyle
  pages: Page[]
  activePageId: string
  createdAt: number
  updatedAt: number
  manifest?: import('./types/manifest').SiteManifest | null
}

export interface HistoryEntry {
  id: string
  label: string
  timestamp: number
  snapshots: Record<string, string>
  manifest?: import('./types/manifest').SiteManifest | null
  sectionOrder?: Array<{ pageId: string; sectionIds: string[] }>
}

interface BuilderStore {
  project: Project
  savedProjects: Project[]
  selectedSectionId: string | null
  previewMode: 'desktop' | 'tablet' | 'mobile'
  generating: boolean
  htmlSnapshots: Record<string, string>
  history: HistoryEntry[]
  manifest: SiteManifest | null
  setManifest: (manifest: SiteManifest) => void
  clearManifest: () => void
  newProjectFromManifest: (manifest: SiteManifest) => void
  updateSectionPatterns: (sectionType: string, patterns: NonNullable<SiteManifest['section_patterns']>[string]) => void

  briefingPresets: Record<PresetSlot, BriefingPreset | null>
  saveBriefingPreset: (slot: PresetSlot, data: BriefingData, label: string) => void
  clearBriefingPreset: (slot: PresetSlot) => void

  // Computed helpers
  page: Page

  setProjectName: (name: string) => void
  setBrand: (brand: Partial<BrandStyle>) => void
  setActivePageId: (id: string) => void
  addPage: (title: string, slug: string) => void
  duplicatePage: (id: string) => void
  deletePage: (id: string) => void
  setPageTitle: (title: string) => void
  setPageSlug: (slug: string) => void
  setPagePrompt: (prompt: string) => void
  setSelectedSection: (id: string | null) => void
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void
  setGenerating: (v: boolean) => void

  fixSectionOrder: () => void
  addSection: (type: SectionType, html: string, prompt: string) => void
  snapshotSections: (ids: string[]) => void
  revertSections: (ids: string[]) => void
  updateSectionHtml: (id: string, html: string) => void
  updateSectionHtmlAcrossPages: (pageId: string, sectionId: string, html: string) => void
  snapshotAllSections: () => void
  revertAllSections: () => void
  pushHistory: (label: string) => void
  revertToHistory: (id: string) => void
  forkFromHistory: (id: string, newLabel: string) => void
  clearHistory: () => void
  syncColorsAcrossPages: (oldColors: Record<string, string>, newColors: Record<string, string>) => void
  injectCssTokens: () => void
  setSectionGenerating: (id: string, v: boolean) => void
  removeSection: (id: string) => void
  reorderSections: (from: number, to: number) => void
  clearSections: () => void

  saveProject: () => void
  loadProject: (id: string) => void
  deleteProject: (id: string) => void
  newProject: () => void

  // Legacy compat
  savedPages: Page[]
  savePage: () => void
  loadPage: (id: string) => void
  deleteSavedPage: (id: string) => void
  newPage: () => void
}

const defaultBrand: BrandStyle = {
  primaryColor: '',
  secondaryColor: '',
  accentColor: '',
  highlightColor: '',
  backgroundColor: '',
  surfaceColor: '',
  darkColor: '',
  textColor: '',
  textMutedColor: '',
  fontFamily: '',
  fontBody: '',
  headingWeight: '',
  borderRadius: '',
  tone: '',
  extraNotes: '',
}

function freshPage(title = 'Home', slug = '/'): Page {
  return {
    id: nanoid(),
    title,
    slug,
    prompt: '',
    sections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function freshProject(): Project {
  const home = freshPage('Home', '/')
  return {
    id: nanoid(),
    name: 'Untitled Project',
    brand: { ...defaultBrand },
    pages: [home],
    activePageId: home.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// Helper: update the active page inside a project
function updateActivePage(project: Project, updater: (p: Page) => Page): Project {
  return {
    ...project,
    updatedAt: Date.now(),
    pages: project.pages.map((p) =>
      p.id === project.activePageId ? updater(p) : p
    ),
  }
}

// Derive the active page from a project (used to keep `page` reactive)
function getActivePage(project: Project): Page {
  return project.pages.find((p) => p.id === project.activePageId) ?? project.pages[0]
}

// Wrap any partial state update that touches `project` so `page` stays in sync
function withPage(partial: Partial<BuilderStore> & { project: Project }): Partial<BuilderStore> {
  return { ...partial, page: getActivePage(partial.project) }
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => {
      const proj = freshProject()

      return {
        project: proj,
        page: getActivePage(proj),
        savedProjects: [],
        savedPages: [],
        selectedSectionId: null,
        previewMode: 'desktop',
        generating: false,
        htmlSnapshots: {},
        history: [],
        manifest: null,
        briefingPresets: { A: null, B: null, C: null },
        saveBriefingPreset: (slot, data, label) =>
          set((s) => ({
            briefingPresets: {
              ...s.briefingPresets,
              [slot]: { label, data, savedAt: Date.now() },
            },
          })),
        clearBriefingPreset: (slot) =>
          set((s) => ({
            briefingPresets: { ...s.briefingPresets, [slot]: null },
          })),
        setManifest: (manifest) => set((s) => ({
          manifest,
          project: {
            ...s.project,
            manifest,
            updatedAt: Date.now(),
            brand: {
              ...s.project.brand,
              primaryColor:    manifest.design_tokens.colors.primary,
              secondaryColor:  manifest.design_tokens.colors.secondary,
              accentColor:     manifest.design_tokens.colors.accent,
              highlightColor:  manifest.design_tokens.colors.highlight,
              backgroundColor: manifest.design_tokens.colors.background,
              surfaceColor:    manifest.design_tokens.colors.surface,
              darkColor:       manifest.design_tokens.colors.dark,
              textColor:       manifest.design_tokens.colors.text,
              textMutedColor:  manifest.design_tokens.colors.text_muted,
              fontFamily:      manifest.design_tokens.typography.font_heading,
              fontBody:        manifest.design_tokens.typography.font_body,
              headingWeight:   manifest.design_tokens.typography.heading_weight,
              tone:            manifest.site.tone,
            },
          },
        })),
        updateSectionPatterns: (sectionType, patterns) => set((s) => {
          if (!s.manifest) return {}
          const updated: SiteManifest = {
            ...s.manifest,
            section_patterns: { ...(s.manifest.section_patterns ?? {}), [sectionType]: patterns },
          }
          return { manifest: updated, project: { ...s.project, manifest: updated, updatedAt: Date.now() } }
        }),
        clearManifest: () => set((s) => ({
          manifest: null,
          project: { ...s.project, manifest: null, updatedAt: Date.now() },
        })),
        newProjectFromManifest: (manifest) => {
          const pages = manifest.pages.map((mp, i) =>
            i === 0
              ? freshPage(mp.title, mp.slug)
              : freshPage(mp.title, mp.slug)
          )
          const project: Project = {
            id: nanoid(),
            name: manifest.content.company_name,
            brand: {
              primaryColor:    manifest.design_tokens.colors.primary,
              secondaryColor:  manifest.design_tokens.colors.secondary,
              accentColor:     manifest.design_tokens.colors.accent,
              highlightColor:  manifest.design_tokens.colors.highlight,
              backgroundColor: manifest.design_tokens.colors.background,
              surfaceColor:    manifest.design_tokens.colors.surface,
              darkColor:       manifest.design_tokens.colors.dark,
              textColor:       manifest.design_tokens.colors.text,
              textMutedColor:  manifest.design_tokens.colors.text_muted,
              fontFamily:      manifest.design_tokens.typography.font_heading,
              fontBody:        manifest.design_tokens.typography.font_body,
              headingWeight:   manifest.design_tokens.typography.heading_weight,
              borderRadius:    '',
              tone:            manifest.site.tone,
              extraNotes:      '',
            },
            pages,
            activePageId: pages[0].id,
            manifest,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          set(() => ({ ...withPage({ project }), manifest, selectedSectionId: null }))
        },

        // Legacy compat shims
        savePage: () => get().saveProject(),
        loadPage: (id) => {
          const proj = get().savedProjects.find((pr) => pr.pages.some((p) => p.id === id))
          if (proj) {
            set({ project: { ...proj, activePageId: id } })
          }
        },
        deleteSavedPage: (id) => get().deleteProject(id),
        newPage: () => get().newProject(),

        setProjectName: (name) => set((s) => withPage({ project: { ...s.project, name, updatedAt: Date.now() } })),
        setBrand: (brand) => set((s) => {
          const newBrand = { ...s.project.brand, ...brand }
          const updatedManifest = s.manifest ? {
            ...s.manifest,
            design_tokens: {
              ...s.manifest.design_tokens,
              colors: {
                ...s.manifest.design_tokens.colors,
                primary:    newBrand.primaryColor   || s.manifest.design_tokens.colors.primary,
                secondary:  newBrand.secondaryColor || s.manifest.design_tokens.colors.secondary,
                accent:     newBrand.accentColor    || s.manifest.design_tokens.colors.accent,
                highlight:  newBrand.highlightColor || s.manifest.design_tokens.colors.highlight,
                background: newBrand.backgroundColor|| s.manifest.design_tokens.colors.background,
                surface:    newBrand.surfaceColor   || s.manifest.design_tokens.colors.surface,
                dark:       newBrand.darkColor      || s.manifest.design_tokens.colors.dark,
                text:       newBrand.textColor      || s.manifest.design_tokens.colors.text,
                text_muted: newBrand.textMutedColor || s.manifest.design_tokens.colors.text_muted,
              },
              typography: {
                ...s.manifest.design_tokens.typography,
                font_heading:   newBrand.fontFamily     || s.manifest.design_tokens.typography.font_heading,
                font_body:      newBrand.fontBody       || s.manifest.design_tokens.typography.font_body,
                heading_weight: newBrand.headingWeight  || s.manifest.design_tokens.typography.heading_weight,
              },
            },
          } : s.manifest
          return {
            ...withPage({ project: { ...s.project, brand: newBrand, updatedAt: Date.now() } }),
            manifest: updatedManifest,
          }
        }),

        setActivePageId: (id) => set((s) => ({
          ...withPage({ project: { ...s.project, activePageId: id } }),
          selectedSectionId: null,
        })),

        addPage: (title, slug) => set((s) => {
          const newPage = freshPage(title, slug)
          const project = {
            ...s.project,
            pages: [...s.project.pages, newPage],
            activePageId: newPage.id,
            updatedAt: Date.now(),
          }
          return { ...withPage({ project }), selectedSectionId: null }
        }),

        duplicatePage: (id) => set((s) => {
          const src = s.project.pages.find((p) => p.id === id)
          if (!src) return s
          const copy: Page = {
            ...src,
            id: nanoid(),
            title: src.title + ' (copy)',
            slug: src.slug + '-copy',
            sections: src.sections.map((sec) => ({ ...sec, id: nanoid() })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          const project = {
            ...s.project,
            pages: [...s.project.pages, copy],
            activePageId: copy.id,
            updatedAt: Date.now(),
          }
          return { ...withPage({ project }), selectedSectionId: null }
        }),

        deletePage: (id) => set((s) => {
          if (s.project.pages.length <= 1) return s
          const remaining = s.project.pages.filter((p) => p.id !== id)
          const newActiveId = s.project.activePageId === id ? remaining[0].id : s.project.activePageId
          const project = { ...s.project, pages: remaining, activePageId: newActiveId, updatedAt: Date.now() }
          return { ...withPage({ project }), selectedSectionId: null }
        }),

        setPageTitle: (title) => set((s) => withPage({ project: updateActivePage(s.project, (p) => ({ ...p, title, updatedAt: Date.now() })) })),
        setPageSlug: (slug) => set((s) => withPage({ project: updateActivePage(s.project, (p) => ({ ...p, slug, updatedAt: Date.now() })) })),
        setPagePrompt: (prompt) => set((s) => withPage({ project: updateActivePage(s.project, (p) => ({ ...p, prompt })) })),
        setSelectedSection: (id) => set({ selectedSectionId: id }),
        setPreviewMode: (mode) => set({ previewMode: mode }),
        setGenerating: (v) => set({ generating: v }),

        snapshotSections: (ids) =>
          set((s) => {
            const snap = { ...s.htmlSnapshots }
            const page = getActivePage(s.project)
            ids.forEach((id) => {
              const sec = page.sections.find((sec: Section) => sec.id === id)
              if (sec) snap[id] = sec.html
            })
            return { htmlSnapshots: snap }
          }),

        revertSections: (ids) =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => ({
              ...p,
              updatedAt: Date.now(),
              sections: p.sections.map((sec) =>
                ids.includes(sec.id) && s.htmlSnapshots[sec.id] != null
                  ? { ...sec, html: s.htmlSnapshots[sec.id] }
                  : sec
              ),
            })),
          })),

        fixSectionOrder: () =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => {
              const navbar = p.sections.filter((sec) => sec.type === 'navbar')
              const footer = p.sections.filter((sec) => sec.type === 'footer')
              const middle = p.sections.filter((sec) => sec.type !== 'navbar' && sec.type !== 'footer')
              return { ...p, updatedAt: Date.now(), sections: [...navbar, ...middle, ...footer] }
            }),
          })),

        addSection: (type, html, prompt) =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => {
              const newSection = {
                id: nanoid(), type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
                html, prompt, generating: false,
              }
              // navbar always first, footer always last
              let sections: typeof p.sections
              if (type === 'navbar') {
                sections = [newSection, ...p.sections]
              } else if (type === 'footer') {
                sections = [...p.sections, newSection]
              } else {
                // insert before footer if one exists, otherwise at end
                const footerIdx = p.sections.findIndex((s) => s.type === 'footer')
                if (footerIdx !== -1) {
                  sections = [...p.sections.slice(0, footerIdx), newSection, ...p.sections.slice(footerIdx)]
                } else {
                  sections = [...p.sections, newSection]
                }
              }
              return { ...p, updatedAt: Date.now(), sections }
            }),
          })),

        updateSectionHtmlAcrossPages: (pageId, sectionId, html) =>
          set((s) => {
            const project = {
              ...s.project,
              updatedAt: Date.now(),
              pages: s.project.pages.map((p) =>
                p.id === pageId
                  ? { ...p, sections: p.sections.map((sec) => sec.id === sectionId ? { ...sec, html, generating: false } : sec) }
                  : p
              ),
            }
            return withPage({ project })
          }),

        snapshotAllSections: () =>
          set((s) => {
            const snap = { ...s.htmlSnapshots }
            s.project.pages.forEach((p) => {
              p.sections.forEach((sec) => { snap[sec.id] = sec.html })
            })
            return { htmlSnapshots: snap }
          }),

        revertAllSections: () =>
          set((s) => {
            const snap = s.htmlSnapshots
            const project = {
              ...s.project,
              updatedAt: Date.now(),
              pages: s.project.pages.map((p) => ({
                ...p,
                sections: p.sections
                  .map((sec) => snap[sec.id] != null ? { ...sec, html: snap[sec.id] } : sec)
                  // Ensure navbar is first, footer is last after restoring
                  .sort((a, b) => {
                    if (a.type === 'navbar') return -1
                    if (b.type === 'navbar') return 1
                    if (a.type === 'footer') return 1
                    if (b.type === 'footer') return -1
                    return 0
                  }),
              })),
            }
            return withPage({ project })
          }),

        pushHistory: (label) =>
          set((s) => {
            const snap: Record<string, string> = {}
            const sectionOrder: Array<{ pageId: string; sectionIds: string[] }> = []
            s.project.pages.forEach((p) => {
              p.sections.forEach((sec) => { snap[sec.id] = sec.html })
              sectionOrder.push({ pageId: p.id, sectionIds: p.sections.map((sec) => sec.id) })
            })
            const entry: HistoryEntry = {
              id: nanoid(),
              label,
              timestamp: Date.now(),
              snapshots: snap,
              manifest: s.manifest ? JSON.parse(JSON.stringify(s.manifest)) : null,
              sectionOrder,
            }
            return { history: [entry, ...s.history].slice(0, 30) }
          }),

        revertToHistory: (id) =>
          set((s) => {
            const entry = s.history.find((h) => h.id === id)
            if (!entry) return s
            const project = {
              ...s.project,
              updatedAt: Date.now(),
              pages: s.project.pages.map((p) => {
                // Restore section order if captured in this history entry
                const savedOrder = entry.sectionOrder?.find((so) => so.pageId === p.id)
                if (savedOrder) {
                  // Rebuild sections in saved order, restoring HTML from snapshot
                  const secMap = Object.fromEntries(p.sections.map((sec) => [sec.id, sec]))
                  const ordered = savedOrder.sectionIds
                    .map((sid) => {
                      const sec = secMap[sid]
                      if (!sec) return null
                      return entry.snapshots[sid] != null ? { ...sec, html: entry.snapshots[sid] } : sec
                    })
                    .filter(Boolean) as typeof p.sections
                  return { ...p, sections: ordered }
                }
                // Fallback: restore HTML only, keep current order
                return {
                  ...p,
                  sections: p.sections.map((sec) =>
                    entry.snapshots[sec.id] != null ? { ...sec, html: entry.snapshots[sec.id] } : sec
                  ),
                }
              }),
            }
            const next = withPage({ project })
            return entry.manifest ? { ...next, manifest: entry.manifest } : next
          }),

        forkFromHistory: (id, newLabel) =>
          set((s) => {
            const entry = s.history.find((h) => h.id === id)
            if (!entry) return s
            const forkedProject: Project = {
              ...s.project,
              id: nanoid(),
              name: newLabel,
              updatedAt: Date.now(),
              pages: s.project.pages.map((p) => ({
                ...p,
                sections: p.sections.map((sec) =>
                  entry.snapshots[sec.id] != null ? { ...sec, html: entry.snapshots[sec.id] } : sec
                ),
              })),
            }
            const savedProjects = [forkedProject, ...s.savedProjects]
            return {
              project: forkedProject,
              savedProjects,
              manifest: entry.manifest ?? s.manifest,
            }
          }),

        clearHistory: () => set({ history: [] }),

        // Strip legacy per-section :root blocks — assembler injects tokens globally from manifest
        injectCssTokens: () =>
          set((s) => {
            const project = {
              ...s.project,
              updatedAt: Date.now(),
              pages: s.project.pages.map((p) => ({
                ...p,
                sections: p.sections.map((sec) => ({
                  ...sec,
                  html: sec.html.replace(/<style>:root\{[^<]*\}<\/style>/g, ''),
                })),
              })),
            }
            return withPage({ project })
          }),

        syncColorsAcrossPages: (oldColors, newColors) =>
          set((s) => {
            const pairs = Object.entries(oldColors)
              .map(([key, oldVal]) => ({ old: oldVal, next: newColors[key] }))
              .filter((p) => p.old && p.next && p.old !== p.next)
            if (pairs.length === 0) return s
            const project = {
              ...s.project,
              updatedAt: Date.now(),
              pages: s.project.pages.map((p) => ({
                ...p,
                sections: p.sections.map((sec) => {
                  let html = sec.html
                  pairs.forEach(({ old: o, next: n }) => {
                    // replace all case-insensitive hex occurrences
                    html = html.split(o.toLowerCase()).join(n)
                    html = html.split(o.toUpperCase()).join(n)
                    html = html.split(o).join(n)
                  })
                  return { ...sec, html }
                }),
              })),
            }
            return withPage({ project })
          }),

        updateSectionHtml: (id, html) =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => ({
              ...p,
              updatedAt: Date.now(),
              sections: p.sections.map((sec) => sec.id === id ? { ...sec, html, generating: false } : sec),
            })),
          })),

        setSectionGenerating: (id, v) =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => ({
              ...p,
              sections: p.sections.map((sec) => sec.id === id ? { ...sec, generating: v } : sec),
            })),
          })),

        removeSection: (id) =>
          set((s) => ({
            selectedSectionId: s.selectedSectionId === id ? null : s.selectedSectionId,
            ...withPage({
              project: updateActivePage(s.project, (p) => ({
                ...p,
                updatedAt: Date.now(),
                sections: p.sections.filter((sec) => sec.id !== id),
              })),
            }),
          })),

        reorderSections: (from, to) =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => {
              const sections = [...p.sections]
              const [moved] = sections.splice(from, 1)
              sections.splice(to, 0, moved)
              return { ...p, updatedAt: Date.now(), sections }
            }),
          })),

        clearSections: () =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => ({ ...p, updatedAt: Date.now(), sections: [] })),
          })),

        saveProject: () =>
          set((s) => {
            const toSave = { ...s.project, updatedAt: Date.now(), manifest: s.manifest ?? s.project.manifest }
            const existing = s.savedProjects.findIndex((p) => p.id === toSave.id)
            const savedProjects = existing >= 0
              ? s.savedProjects.map((p) => p.id === toSave.id ? toSave : p)
              : [toSave, ...s.savedProjects]
            return { ...withPage({ project: toSave }), savedProjects }
          }),

        loadProject: (id) =>
          set((s) => {
            const found = s.savedProjects.find((p) => p.id === id)
            if (!found) return s
            return {
              ...withPage({ project: found }),
              manifest: found.manifest ?? null,
              selectedSectionId: null,
            }
          }),

        deleteProject: (id) =>
          set((s) => ({ savedProjects: s.savedProjects.filter((p) => p.id !== id) })),

        newProject: () => {
          const project = freshProject()
          set(() => ({ ...withPage({ project }), selectedSectionId: null }))
        },
      }
    },
    {
      name: 'pagecraft-store-v2',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.page = getActivePage(state.project)
          // Ensure top-level manifest stays in sync with the persisted project.manifest
          if (state.project.manifest) {
            state.manifest = state.project.manifest
          }
        }
      },
      partialize: (s) => ({
        project: {
          ...s.project,
          pages: s.project.pages.map((p) => ({
            ...p,
            sections: p.sections.map((sec) => ({ ...sec, generating: false })),
          })),
        },
        savedProjects: s.savedProjects.map((proj) => ({
          ...proj,
          pages: proj.pages.map((p) => ({
            ...p,
            sections: p.sections.map((sec) => ({ ...sec, generating: false })),
          })),
        })),
        manifest: s.manifest,
        briefingPresets: s.briefingPresets,
        history: s.history,
      }),
    }
  )
)
