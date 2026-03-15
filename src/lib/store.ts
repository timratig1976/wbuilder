import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { SiteManifest } from './types/manifest'

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
  fontFamily: string
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

interface BuilderStore {
  project: Project
  savedProjects: Project[]
  selectedSectionId: string | null
  previewMode: 'desktop' | 'mobile'
  generating: boolean
  htmlSnapshots: Record<string, string>
  manifest: SiteManifest | null
  setManifest: (manifest: SiteManifest) => void
  clearManifest: () => void
  newProjectFromManifest: (manifest: SiteManifest) => void

  // Computed helpers
  page: Page

  setProjectName: (name: string) => void
  setBrand: (brand: Partial<BrandStyle>) => void
  setActivePageId: (id: string) => void
  addPage: (title: string, slug: string) => void
  deletePage: (id: string) => void
  setPageTitle: (title: string) => void
  setPageSlug: (slug: string) => void
  setPagePrompt: (prompt: string) => void
  setSelectedSection: (id: string | null) => void
  setPreviewMode: (mode: 'desktop' | 'mobile') => void
  setGenerating: (v: boolean) => void

  addSection: (type: SectionType, html: string, prompt: string) => void
  snapshotSections: (ids: string[]) => void
  revertSections: (ids: string[]) => void
  updateSectionHtml: (id: string, html: string) => void
  updateSectionHtmlAcrossPages: (pageId: string, sectionId: string, html: string) => void
  snapshotAllSections: () => void
  revertAllSections: () => void
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
  fontFamily: '',
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
        manifest: null,
        setManifest: (manifest) => set((s) => ({
          manifest,
          project: { ...s.project, manifest, updatedAt: Date.now() },
        })),
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
              primaryColor: manifest.design_tokens.colors.primary,
              secondaryColor: manifest.design_tokens.colors.secondary,
              fontFamily: manifest.design_tokens.typography.font_heading,
              borderRadius: '',
              tone: manifest.site.tone,
              extraNotes: '',
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
        setBrand: (brand) => set((s) => withPage({ project: { ...s.project, brand: { ...s.project.brand, ...brand }, updatedAt: Date.now() } })),

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

        addSection: (type, html, prompt) =>
          set((s) => withPage({
            project: updateActivePage(s.project, (p) => ({
              ...p,
              updatedAt: Date.now(),
              sections: [...p.sections, {
                id: nanoid(), type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
                html, prompt, generating: false,
              }],
            })),
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
                sections: p.sections.map((sec) =>
                  snap[sec.id] != null ? { ...sec, html: snap[sec.id] } : sec
                ),
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
            const toSave = { ...s.project, updatedAt: Date.now() }
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
            return { ...withPage({ project: found }), selectedSectionId: null }
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
      }),
    }
  )
)
