import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

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
  prompt: string
  sections: Section[]
  createdAt: number
  updatedAt: number
}

interface BuilderStore {
  page: Page
  savedPages: Page[]
  selectedSectionId: string | null
  previewMode: 'desktop' | 'mobile'
  generating: boolean

  setPageTitle: (title: string) => void
  setPagePrompt: (prompt: string) => void
  setSelectedSection: (id: string | null) => void
  setPreviewMode: (mode: 'desktop' | 'mobile') => void
  setGenerating: (v: boolean) => void

  addSection: (type: SectionType, html: string, prompt: string) => void
  updateSectionHtml: (id: string, html: string) => void
  setSectionGenerating: (id: string, v: boolean) => void
  removeSection: (id: string) => void
  reorderSections: (from: number, to: number) => void
  clearSections: () => void

  savePage: () => void
  loadPage: (id: string) => void
  deleteSavedPage: (id: string) => void
  newPage: () => void
}

function freshPage(): Page {
  return {
    id: nanoid(),
    title: 'Untitled Page',
    prompt: '',
    sections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      page: freshPage(),
      savedPages: [],
      selectedSectionId: null,
      previewMode: 'desktop',
      generating: false,

      setPageTitle: (title) => set((s) => ({ page: { ...s.page, title } })),
      setPagePrompt: (prompt) => set((s) => ({ page: { ...s.page, prompt } })),
      setSelectedSection: (id) => set({ selectedSectionId: id }),
      setPreviewMode: (mode) => set({ previewMode: mode }),
      setGenerating: (v) => set({ generating: v }),

      addSection: (type, html, prompt) =>
        set((s) => ({
          page: {
            ...s.page,
            updatedAt: Date.now(),
            sections: [
              ...s.page.sections,
              {
                id: nanoid(),
                type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
                html,
                prompt,
                generating: false,
              },
            ],
          },
        })),

      updateSectionHtml: (id, html) =>
        set((s) => ({
          page: {
            ...s.page,
            updatedAt: Date.now(),
            sections: s.page.sections.map((sec) =>
              sec.id === id ? { ...sec, html, generating: false } : sec
            ),
          },
        })),

      setSectionGenerating: (id, v) =>
        set((s) => ({
          page: {
            ...s.page,
            sections: s.page.sections.map((sec) =>
              sec.id === id ? { ...sec, generating: v } : sec
            ),
          },
        })),

      removeSection: (id) =>
        set((s) => ({
          selectedSectionId: s.selectedSectionId === id ? null : s.selectedSectionId,
          page: {
            ...s.page,
            updatedAt: Date.now(),
            sections: s.page.sections.filter((sec) => sec.id !== id),
          },
        })),

      reorderSections: (from, to) =>
        set((s) => {
          const sections = [...s.page.sections]
          const [moved] = sections.splice(from, 1)
          sections.splice(to, 0, moved)
          return { page: { ...s.page, updatedAt: Date.now(), sections } }
        }),

      clearSections: () =>
        set((s) => ({ page: { ...s.page, updatedAt: Date.now(), sections: [] } })),

      savePage: () =>
        set((s) => {
          const pageToSave = { ...s.page, updatedAt: Date.now() }
          const existing = s.savedPages.findIndex((p) => p.id === pageToSave.id)
          const savedPages = existing >= 0
            ? s.savedPages.map((p) => p.id === pageToSave.id ? pageToSave : p)
            : [pageToSave, ...s.savedPages]
          return { savedPages, page: pageToSave }
        }),

      loadPage: (id) =>
        set((s) => {
          const found = s.savedPages.find((p) => p.id === id)
          if (!found) return s
          return { page: found, selectedSectionId: null }
        }),

      deleteSavedPage: (id) =>
        set((s) => ({
          savedPages: s.savedPages.filter((p) => p.id !== id),
        })),

      newPage: () =>
        set(() => ({
          page: freshPage(),
          selectedSectionId: null,
        })),
    }),
    {
      name: 'pagecraft-store',
      // Don't persist transient UI state
      partialize: (s) => ({
        page: {
          ...s.page,
          sections: s.page.sections.map((sec) => ({ ...sec, generating: false })),
        },
        savedPages: s.savedPages.map((p) => ({
          ...p,
          sections: p.sections.map((sec) => ({ ...sec, generating: false })),
        })),
      }),
    }
  )
)
