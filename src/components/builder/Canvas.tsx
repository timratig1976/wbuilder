'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useBuilderStore } from '@/lib/store'
import { assemblePreview, buildBaseStyle, scopeScripts } from '@/lib/assembler'
import { Loader2, Monitor, Smartphone, Tablet, Plus, Type, MousePointer2, Trash2, Undo2 } from 'lucide-react'

function autoResizeIframe(iframe: HTMLIFrameElement) {
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc?.body) return
    const h = doc.documentElement.scrollHeight || doc.body.scrollHeight
    if (h > 0) iframe.style.height = h + 'px'
  } catch { /* cross-origin guard */ }
}

// All potentially editable text elements — leaf check below prevents double-editing
const EDITABLE_SELECTORS = [
  'h1','h2','h3','h4','h5','h6',
  'p','li','td','th','dt','dd','blockquote','figcaption','caption',
  'button','a','label',
  'span','strong','em','small','mark','b','i',
].join(',')

// Returns true if element has any direct text content (not just whitespace)
function hasDirectText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true
  }
  return false
}

// Returns true if el has no child elements that themselves have direct text
// (i.e. el is the deepest meaningful text node — true leaf)
function isTextLeaf(el: Element): boolean {
  const childEls = Array.from(el.querySelectorAll(EDITABLE_SELECTORS))
  return !childEls.some((child) => hasDirectText(child))
}

export function Canvas() {
  const { page, manifest, selectedSectionId, previewMode, generating, setSelectedSection, setPreviewMode, updateSectionHtml, snapshotSections, revertSections, pushHistory } =
    useBuilderStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastFullWriteRef = useRef<number>(0)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [textEditMode, setTextEditMode] = useState(false)
  const textEditModeRef = useRef(false)
  const [elemSelectMode, setElemSelectMode] = useState(false)
  const elemSelectModeRef = useRef(false)
  const [canUndoEdit, setCanUndoEdit] = useState(false)

  // Keep refs in sync so iframe callbacks always see current mode
  useEffect(() => { textEditModeRef.current = textEditMode }, [textEditMode])
  useEffect(() => { elemSelectModeRef.current = elemSelectMode }, [elemSelectMode])

  const sections = page.sections
  const sectionCount = sections.length
  const sectionIds = sections.map((s) => s.id).join(',')

  // Full rewrite when section list structure or preview mode changes
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const html = assemblePreview(sections, manifest)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    lastFullWriteRef.current = Date.now()
    doc.open()
    doc.write(html)
    doc.close()

    const afterWrite = () => {
      // Re-attach click listeners only — assemblePreview already wrote correct HTML
      const sectionEls = doc.querySelectorAll<HTMLElement>('[data-section-id]')
      sectionEls.forEach((el) => {
        el.addEventListener('click', (e) => {
          // Don't switch section selection while in any edit mode
          if (textEditModeRef.current || elemSelectModeRef.current) return
          e.stopPropagation()
          const id = el.getAttribute('data-section-id')
          if (id) {
            const current = useBuilderStore.getState().selectedSectionId
            useBuilderStore.getState().setSelectedSection(id === current ? null : id)
          }
        })
      })
      // Resize iframe to full content height so sticky positioning works
      autoResizeIframe(iframe)
      // Observe body size changes (e.g. lazy images, animations expanding content)
      resizeObserverRef.current?.disconnect()
      if (doc.body) {
        const ro = new ResizeObserver(() => autoResizeIframe(iframe))
        ro.observe(doc.body)
        resizeObserverRef.current = ro
      }
    }
    iframe.addEventListener('load', afterWrite, { once: true })
    afterWrite()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCount, sectionIds, previewMode, manifest])

  // Surgically update base styles (CSS vars + token utility classes) when manifest changes
  // (without triggering a full iframe rewrite that would flicker the page)
  useEffect(() => {
    if (!manifest) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || !doc.head) return
    let el = doc.getElementById('root-tokens') as HTMLStyleElement | null
    if (!el) {
      el = doc.createElement('style')
      el.id = 'root-tokens'
      doc.head.appendChild(el)
    }
    el.textContent = buildBaseStyle(manifest)
  }, [manifest])

  // Surgical per-section HTML update — no full rewrite needed
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const win = iframe.contentWindow
    const doc = iframe.contentDocument || win?.document
    if (!doc || !doc.body) return
    sections.forEach((s) => {
      const el = doc.querySelector<HTMLElement>(`[data-section-id="${s.id}"]`)
      if (!el) return
      // Skip placeholders — shimmer JS inside iframe handles those
      if (s.html.startsWith('<!--')) return
      const next = s.html.trim()
      // Only update if content actually changed (hash check)
      if (el.getAttribute('data-html-hash') === next.length.toString() + next.slice(0, 32)) return
      el.setAttribute('data-html-hash', next.length.toString() + next.slice(0, 32))
      // Clear all intervals/timeouts in iframe before rewriting so stale setInterval
      // callbacks (word-cycle, animations) don't crash on missing elements
      if (win) {
        for (let i = 0; i <= 1000; i++) {
          try { win.clearInterval(i); win.clearTimeout(i) } catch { /* ignore */ }
        }
      }
      // Use createContextualFragment so <script> tags execute
      el.innerHTML = ''
      const safe = scopeScripts(next)
      try {
        const frag = doc.createRange().createContextualFragment(safe)
        el.appendChild(frag)
      } catch {
        el.innerHTML = safe
      }
    })
    // Re-measure after content changes so sticky still works
    const iframeEl = iframeRef.current
    if (iframeEl) setTimeout(() => autoResizeIframe(iframeEl), 50)
  }, [sections])

  // Sync selected section highlight into iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc?.body) return
    const sectionEls = doc.querySelectorAll<HTMLElement>('[data-section-id]')
    sectionEls.forEach((el) => {
      if (!el) return
      const id = el.getAttribute('data-section-id')
      try {
        if (id === selectedSectionId) {
          el.classList.add('selected')
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        } else {
          el.classList.remove('selected')
        }
      } catch { /* iframe mid-rewrite — skip */ }
    })
  }, [selectedSectionId, sectionIds])

  // Deactivate text edit mode — remove all contenteditable and injected styles from iframe
  const deactivateTextEdit = useCallback(() => {
    setTextEditMode(false)
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.querySelectorAll<HTMLElement>('[data-inline-editable]').forEach((el) => {
      el.removeAttribute('contenteditable')
      el.removeAttribute('data-inline-editable')
      el.removeAttribute('tabindex')
      el.style.outline = ''
      el.style.cursor = ''
      el.style.background = ''
      el.style.boxShadow = ''
    })
    // Remove injected edit-mode stylesheet
    doc.getElementById('__text-edit-styles')?.remove()
    try { (doc.body as HTMLElement).style.cursor = '' } catch { /* ignore */ }
  }, [])

  // Activate text edit mode for the selected section
  const activateTextEdit = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Snapshot current state so user can undo all text changes
    const ids = useBuilderStore.getState().page.sections.map((s) => s.id)
    snapshotSections(ids)
    pushHistory('Before text edit')
    setCanUndoEdit(true)
    setTextEditMode(true)

    // Inject edit-mode styles into iframe for hover/focus feedback
    const styleId = '__text-edit-styles'
    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style')
      style.id = styleId
      style.textContent = `
        [data-inline-editable] {
          cursor: text !important;
          border-radius: 3px;
          transition: outline 0.1s, background 0.1s;
          outline: 2px dashed transparent;
          outline-offset: 2px;
        }
        [data-inline-editable]:hover {
          outline: 2px dashed rgba(139,92,246,0.55) !important;
          background: rgba(139,92,246,0.04) !important;
        }
        [data-inline-editable]:hover::after {
          content: '✎';
          position: absolute;
          font-size: 10px;
          color: rgba(139,92,246,0.8);
          margin-left: 4px;
          pointer-events: none;
        }
        [data-inline-editable]:focus {
          outline: 2px solid rgba(99,102,241,0.9) !important;
          outline-offset: 2px;
          background: rgba(99,102,241,0.04) !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
        }
        [data-inline-editable]:focus-visible {
          outline: 2px solid rgba(99,102,241,0.9) !important;
        }
      `
      doc.head.appendChild(style)
    }

    // Set iframe body cursor
    try { (doc.body as HTMLElement).style.cursor = 'default' } catch { /* ignore */ }

    // Find the selected section wrapper or all sections if none selected
    const sectionId = useBuilderStore.getState().selectedSectionId
    const scope = sectionId
      ? doc.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`) ?? doc.body
      : doc.body

    // Serialize a section wrapper's innerHTML back to the store (strips edit artifacts)
    function serializeSection(sectionWrapper: HTMLElement) {
      const id = sectionWrapper.getAttribute('data-section-id')
      if (!id) return
      const cleaned = sectionWrapper.innerHTML
        .replace(/ contenteditable="true"/g, '')
        .replace(/ data-inline-editable="1"/g, '')
        .replace(/ style="outline:[^"]*"/g, (m) => {
          const c = m
            .replace(/outline:[^;"]*(;|\s)*/g, '')
            .replace(/border-radius:2px;?\s*/g, '')
            .replace(/cursor:text;?\s*/g, '')
          return c === ' style=""' ? '' : c
        })
      useBuilderStore.getState().updateSectionHtml(id, cleaned)
    }

    // Make all text elements contenteditable within scope
    // Only target elements that have direct text content — skip pure containers
    scope.querySelectorAll<HTMLElement>(EDITABLE_SELECTORS).forEach((el) => {
      if (el.closest('script, style, noscript')) return
      // Skip if already made editable (avoid double-registering on re-activate)
      if (el.hasAttribute('data-inline-editable')) return
      // Only make true text leaves editable — skip if a child element already has direct text
      // Examples: p > span → p is skipped, span is editable
      //           li (direct text) → li is editable
      //           div.badge > span (direct text) → span is editable
      if (!isTextLeaf(el) && !hasDirectText(el)) return

      el.setAttribute('contenteditable', 'true')
      el.setAttribute('data-inline-editable', '1')
      // tabindex so Tab key moves between editable fields
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0')

      // Stop clicks from bubbling to section wrapper (prevents section rewrite while editing)
      el.addEventListener('click', (e) => { e.stopPropagation() }, { once: false })
      el.addEventListener('pointerdown', (e) => { e.stopPropagation() }, { once: false })

      el.addEventListener('blur', () => {
        const sectionWrapper = el.closest<HTMLElement>('[data-section-id]')
        if (sectionWrapper) serializeSection(sectionWrapper)
      }, { once: false })
    })
  }, [snapshotSections, pushHistory])

  // Toggle text edit mode
  const toggleTextEdit = useCallback(() => {
    if (textEditModeRef.current) {
      deactivateTextEdit()
    } else {
      activateTextEdit()
    }
  }, [activateTextEdit, deactivateTextEdit])

  // Turn off text edit when section structure changes (full rewrite)
  useEffect(() => {
    if (textEditMode) deactivateTextEdit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCount, sectionIds])

  // ── Element select + delete mode ──────────────────────────────────────────
  const ELEM_SELECT_SELECTORS = 'section,div,article,aside,header,footer,nav,figure,img,svg,ul,ol,li,p,h1,h2,h3,h4,h5,h6,span,a,button,blockquote,table,tr,td,th,form,input,label'

  const deactivateElemSelect = useCallback(() => {
    setElemSelectMode(false)
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    // Remove all selection/hover attributes
    doc.querySelectorAll<HTMLElement>('[data-elem-selectable]').forEach((el) => {
      el.removeAttribute('data-elem-selectable')
      el.removeAttribute('data-elem-selected')
      el.removeAttribute('data-elem-hover')
      el.style.outline = ''
      el.style.cursor = ''
    })
    // Also sweep any stray hover/selected attrs not in selectable set
    doc.querySelectorAll<HTMLElement>('[data-elem-hover],[data-elem-selected]').forEach((el) => {
      el.removeAttribute('data-elem-hover')
      el.removeAttribute('data-elem-selected')
    })
    // Remove injected stylesheet and toolbar
    doc.getElementById('__elem-select-styles')?.remove()
    doc.getElementById('__elem-delete-toolbar')?.remove()
    try { (doc.body as HTMLElement).style.cursor = '' } catch { /* ignore */ }
  }, [])

  const serializeSectionToStore = useCallback((el: HTMLElement) => {
    const wrapper = el.closest<HTMLElement>('[data-section-id]')
    if (!wrapper) return
    const id = wrapper.getAttribute('data-section-id')
    if (!id) return
    const cleaned = wrapper.innerHTML
      .replace(/ data-elem-selectable="1"/g, '')
      .replace(/ data-elem-selected="1"/g, '')
      .replace(/ style="outline:[^;"]*;?[^"]*"/g, (m) => {
        const c = m
          .replace(/outline:[^;"]*;?\s*/g, '')
          .replace(/cursor:pointer;?\s*/g, '')
          .replace(/cursor:default;?\s*/g, '')
        return c === ' style=""' ? '' : c
      })
    useBuilderStore.getState().updateSectionHtml(id, cleaned)
  }, [])

  const activateElemSelect = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Snapshot current state so user can undo all deletions
    const ids = useBuilderStore.getState().page.sections.map((s) => s.id)
    snapshotSections(ids)
    pushHistory('Before element delete')
    setCanUndoEdit(true)
    setElemSelectMode(true)
    try { (doc.body as HTMLElement).style.cursor = 'default' } catch { /* ignore */ }

    const sectionId = useBuilderStore.getState().selectedSectionId
    const scope = sectionId
      ? doc.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`) ?? doc.body
      : doc.body

    let selectedEl: HTMLElement | null = null

    // Inject delete toolbar into iframe DOM
    const getOrCreateToolbar = () => {
      let toolbar = doc.getElementById('__elem-delete-toolbar') as HTMLElement | null
      if (!toolbar) {
        toolbar = doc.createElement('div')
        toolbar.id = '__elem-delete-toolbar'
        toolbar.setAttribute('style', [
          'position:fixed', 'z-index:999999', 'display:none',
          'background:#ef4444', 'color:#fff', 'border-radius:6px',
          'padding:4px 10px', 'font-size:12px', 'font-weight:600',
          'cursor:pointer', 'box-shadow:0 2px 8px rgba(0,0,0,0.3)',
          'user-select:none', 'font-family:sans-serif', 'gap:6px',
          'align-items:center', 'letter-spacing:0.02em',
        ].join(';'))
        toolbar.innerHTML = '<span style="font-size:14px">&#x2715;</span> Delete element'
        doc.body.appendChild(toolbar)
        toolbar.addEventListener('click', (e) => {
          e.stopPropagation()
          if (!selectedEl) return
          const parent = selectedEl.parentElement
          serializeSectionToStore(selectedEl)
          selectedEl.remove()
          selectedEl = null
          toolbar!.style.display = 'none'
          // Re-serialize after removal
          if (parent) {
            const wrapper = parent.closest<HTMLElement>('[data-section-id]')
            if (wrapper) {
              const id = wrapper.getAttribute('data-section-id')
              if (id) {
                const cleaned = wrapper.innerHTML
                  .replace(/ data-elem-selectable="1"/g, '')
                  .replace(/ data-elem-selected="1"/g, '')
                useBuilderStore.getState().updateSectionHtml(id, cleaned)
              }
            }
          }
        })
      }
      return toolbar
    }

    const positionToolbar = (toolbar: HTMLElement, el: HTMLElement) => {
      const rect = el.getBoundingClientRect()
      toolbar.style.display = 'flex'
      toolbar.style.top = Math.max(4, rect.top - 36) + 'px'
      toolbar.style.left = rect.left + 'px'
    }

    // Inject CSS for hover/select feedback — avoids inline style noise
    const styleId = '__elem-select-styles'
    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style')
      style.id = styleId
      style.textContent = `
        [data-elem-hover] { outline: 2px dashed #f97316 !important; outline-offset: 2px; cursor: pointer !important; }
        [data-elem-selected] { outline: 2px solid #ef4444 !important; outline-offset: 2px; cursor: pointer !important; }
      `
      doc.head.appendChild(style)
    }

    let hoveredEl: HTMLElement | null = null

    // Single delegated mousemove — highlights exact element under cursor
    const onMouseMove = (e: MouseEvent) => {
      if (!elemSelectModeRef.current) return
      const target = e.target as HTMLElement
      if (!target || target === hoveredEl) return
      if (target.id === '__elem-delete-toolbar' || target.hasAttribute('data-section-id')) return
      if (target.closest('script,style,noscript')) return

      // Clear previous hover (but not selected)
      if (hoveredEl && hoveredEl !== selectedEl) {
        hoveredEl.removeAttribute('data-elem-hover')
      }
      // Don't hover-highlight the selected element
      if (!target.hasAttribute('data-elem-selected')) {
        target.setAttribute('data-elem-hover', '1')
      }
      hoveredEl = target
    }

    const onMouseLeave = () => {
      if (hoveredEl && hoveredEl !== selectedEl) {
        hoveredEl.removeAttribute('data-elem-hover')
        hoveredEl = null
      }
    }

    // Single delegated click — selects exact clicked element
    const onClick = (e: MouseEvent) => {
      if (!elemSelectModeRef.current) return
      const target = e.target as HTMLElement
      if (!target || target.id === '__elem-delete-toolbar') return
      if (target.hasAttribute('data-section-id') || target.closest('script,style,noscript')) return
      e.stopPropagation()

      // Deselect previous
      if (selectedEl && selectedEl !== target) {
        selectedEl.removeAttribute('data-elem-selected')
        selectedEl.style.cssText = ''
      }
      // Clear hover on clicked element
      target.removeAttribute('data-elem-hover')
      target.setAttribute('data-elem-selected', '1')
      selectedEl = target

      const toolbar = getOrCreateToolbar()
      positionToolbar(toolbar, target)
    }

    scope.addEventListener('mousemove', onMouseMove)
    scope.addEventListener('mouseleave', onMouseLeave)
    scope.addEventListener('click', onClick)

    // Delete key handler inside iframe
    doc.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!elemSelectModeRef.current) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEl) {
        e.preventDefault()
        const wrapper = selectedEl.closest<HTMLElement>('[data-section-id]')
        selectedEl.remove()
        selectedEl = null
        doc.getElementById('__elem-delete-toolbar')?.remove()
        if (wrapper) {
          const id = wrapper.getAttribute('data-section-id')
          if (id) {
            const cleaned = wrapper.innerHTML
              .replace(/ data-elem-selectable="1"/g, '')
              .replace(/ data-elem-selected="1"/g, '')
            useBuilderStore.getState().updateSectionHtml(id, cleaned)
          }
        }
      }
      // Escape deselects
      if (e.key === 'Escape' && selectedEl) {
        selectedEl.style.outline = ''
        selectedEl.removeAttribute('data-elem-selected')
        selectedEl = null
        doc.getElementById('__elem-delete-toolbar')!.style.display = 'none'
      }
    })
  }, [serializeSectionToStore, snapshotSections, pushHistory])

  const toggleElemSelect = useCallback(() => {
    if (elemSelectModeRef.current) {
      deactivateElemSelect()
    } else {
      if (textEditModeRef.current) deactivateTextEdit()
      activateElemSelect()
    }
  }, [activateElemSelect, deactivateElemSelect, deactivateTextEdit])

  // Also deactivate elem select on full rewrite
  useEffect(() => {
    if (elemSelectMode) deactivateElemSelect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCount, sectionIds])

  const handleUndoEdit = useCallback(() => {
    revertSections(useBuilderStore.getState().page.sections.map((s) => s.id))
    deactivateTextEdit()
    deactivateElemSelect()
    setCanUndoEdit(false)
  }, [revertSections, deactivateTextEdit, deactivateElemSelect])

  const isGenerating = generating || page.sections.some((s) => s.generating)

  return (
    <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Preview</span>
          {isGenerating && (
            <span className="flex items-center gap-1 text-xs text-indigo-600">
              <Loader2 className="w-3 h-3 animate-spin" /> Generating…
            </span>
          )}
          {textEditMode && (
            <span className="flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              <Type className="w-3 h-3" /> Editing text — click any text to edit
            </span>
          )}
          {elemSelectMode && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              <MousePointer2 className="w-3 h-3" /> Select mode — click element, then delete
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Text edit toggle */}
          {page.sections.length > 0 && (<>
            <button
              onClick={toggleTextEdit}
              title={textEditMode ? 'Exit text edit mode' : 'Edit text inline'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                textEditMode
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              {textEditMode ? 'Done' : 'Edit text'}
            </button>
            <button
              onClick={toggleElemSelect}
              title={elemSelectMode ? 'Exit select mode' : 'Select & delete elements'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                elemSelectMode
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {elemSelectMode ? 'Done' : 'Delete elements'}
            </button>
            {canUndoEdit && (
              <button
                onClick={handleUndoEdit}
                title="Undo all changes since entering edit mode"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all border border-amber-300"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo edits
              </button>
            )}
          </>)}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              title="Desktop"
              className={`p-1.5 rounded-md transition-all ${
                previewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              title="Tablet (768px)"
              className={`p-1.5 rounded-md transition-all ${
                previewMode === 'tablet' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              title="Mobile (390px)"
              className={`p-1.5 rounded-md transition-all ${
                previewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iframe container */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-0">
        {page.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
            <div className="text-6xl mb-4">✦</div>
            <p className="text-xl font-semibold text-gray-500">Your page preview will appear here</p>
            <p className="text-sm mt-2 max-w-sm">
              Describe your page in the left panel and click <strong>Generate Page</strong>, or add sections manually.
            </p>
          </div>
        ) : (
          <div
            className={`bg-white overflow-hidden transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[390px] shadow-xl rounded-lg'
              : previewMode === 'tablet' ? 'w-[768px] shadow-xl rounded-lg'
              : 'w-full max-w-[1920px]'
            }`}
            style={{ minHeight: '600px' }}
          >
            <iframe
              ref={iframeRef}
              className="w-full border-0 block"
              style={{ minHeight: '600px' }}
              title="Page Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Section quick-select bar */}
      {page.sections.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-gray-200 overflow-x-auto flex-shrink-0">
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Jump to:</span>
          {page.sections.map((section, index) => (
            <div key={section.id} className="relative group">
              <button
                onClick={() => setSelectedSection(section.id === selectedSectionId ? null : section.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSectionId === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {section.generating && <Loader2 className="w-3 h-3 animate-spin" />}
                {section.label}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Show section picker to insert after this section
                  console.log('Insert after section', index)
                }}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                title="Add section after this"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
