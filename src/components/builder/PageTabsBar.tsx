'use client'

import { useState, useRef, useEffect } from 'react'
import { useBuilderStore } from '@/lib/store'
import { Plus, MoreHorizontal, Copy, Trash2, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export function PageTabsBar() {
  const { project, setActivePageId, addPage, deletePage, duplicatePage, setPageTitle } = useBuilderStore()
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [menuPageId, setMenuPageId] = useState<string | null>(null)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adding) newInputRef.current?.focus()
  }, [adding])

  useEffect(() => {
    if (editingPageId) editInputRef.current?.focus()
  }, [editingPageId])

  // Close context menu on outside click
  useEffect(() => {
    if (!menuPageId) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPageId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuPageId])

  function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    const slug = '/' + title.toLowerCase().replace(/\s+/g, '-')
    addPage(title, slug)
    setNewTitle('')
    setAdding(false)
    toast.success(`Page "${title}" added`)
  }

  function handleRenameCommit(id: string) {
    const t = editTitle.trim()
    if (t) {
      // setPageTitle only sets on the active page — switch to target page first
      const prev = project.activePageId
      setActivePageId(id)
      setTimeout(() => {
        useBuilderStore.getState().setPageTitle(t)
        if (prev !== id) setActivePageId(prev)
      }, 0)
    }
    setEditingPageId(null)
  }

  return (
    <div className="flex items-center border-b border-gray-200 bg-white px-2 overflow-x-auto flex-shrink-0 min-h-[38px]">
      {project.pages.map((p) => {
        const isActive = p.id === project.activePageId
        const isEditing = editingPageId === p.id

        return (
          <div key={p.id} className="relative flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer select-none border-b-2 transition-all text-sm group ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 font-semibold bg-indigo-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
              onClick={() => { if (!isEditing) setActivePageId(p.id) }}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCommit(p.id)
                    if (e.key === 'Escape') setEditingPageId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-24 text-sm border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                />
              ) : (
                <span className="whitespace-nowrap max-w-[140px] truncate">{p.title}</span>
              )}

              {isEditing ? (
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleRenameCommit(p.id)} className="p-0.5 text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setEditingPageId(null)} className="p-0.5 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuPageId(menuPageId === p.id ? null : p.id)
                  }}
                  className={`p-0.5 rounded transition-all ${
                    isActive || menuPageId === p.id
                      ? 'text-indigo-400 hover:text-indigo-600'
                      : 'text-transparent group-hover:text-gray-400 hover:!text-gray-600'
                  }`}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Context menu */}
            {menuPageId === p.id && (
              <div
                ref={menuRef}
                className="absolute top-full left-0 mt-1 z-50 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm"
              >
                <button
                  onClick={() => {
                    setEditTitle(p.title)
                    setEditingPageId(p.id)
                    setMenuPageId(null)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" /> Rename
                </button>
                <button
                  onClick={() => {
                    duplicatePage(p.id)
                    setMenuPageId(null)
                    toast.success(`Duplicated "${p.title}"`)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate
                </button>
                {project.pages.length > 1 && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        if (!confirm(`Delete "${p.title}"?`)) return
                        deletePage(p.id)
                        setMenuPageId(null)
                        toast.success(`Deleted "${p.title}"`)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete page
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add page */}
      <div className="flex-shrink-0 ml-1">
        {adding ? (
          <div className="flex items-center gap-1.5 px-2">
            <input
              ref={newInputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
              }}
              placeholder="Page name…"
              className="w-28 text-sm border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button onClick={handleAdd} disabled={!newTitle.trim()} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-40 font-medium">Add</button>
            <button onClick={() => { setAdding(false); setNewTitle('') }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-xs font-medium"
            title="Add new page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
