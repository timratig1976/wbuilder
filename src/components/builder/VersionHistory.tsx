'use client'

import { useState } from 'react'
import { useBuilderStore, HistoryEntry } from '@/lib/store'
import { History, RotateCcw, GitFork, Trash2, X, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function SectionCount({ entry, currentSections }: { entry: HistoryEntry; currentSections: number }) {
  const count = Object.keys(entry.snapshots).length
  const diff = count - currentSections
  return (
    <span className="text-[10px] text-gray-400">
      {count} section{count !== 1 ? 's' : ''}
      {diff !== 0 && (
        <span className={diff > 0 ? 'text-emerald-500' : 'text-rose-400'}>
          {' '}{diff > 0 ? `+${diff}` : diff}
        </span>
      )}
    </span>
  )
}

interface VersionHistoryProps {
  onClose: () => void
}

export function VersionHistory({ onClose }: VersionHistoryProps) {
  const { history, revertToHistory, forkFromHistory, clearHistory, page } = useBuilderStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [forkName, setForkName] = useState<Record<string, string>>({})

  function handleRevert(entry: HistoryEntry) {
    if (!confirm(`Restore to "${entry.label}"? Current state will be lost (unless saved).`)) return
    revertToHistory(entry.id)
    toast.success(`Restored: ${entry.label}`)
    onClose()
  }

  function handleFork(entry: HistoryEntry) {
    const name = forkName[entry.id]?.trim() || `${entry.label} (copy)`
    forkFromHistory(entry.id, name)
    toast.success(`Forked as "${name}"`)
    onClose()
  }

  return (
    <div className="absolute top-14 right-0 z-50 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" /> Version History
        </span>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => { if (confirm('Clear all history?')) clearHistory() }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4">
            <History className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No versions yet</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Versions are saved automatically after each generation or regen.
              You can also save a version manually.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {history.map((entry, idx) => (
              <li key={entry.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Badge for latest */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {idx === 0 && (
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                          Latest
                        </span>
                      )}
                      {entry.manifest && (
                        <span className="text-[9px] font-medium bg-violet-100 text-violet-600 rounded-full px-1.5 py-0.5">
                          w/ design system
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate leading-tight">{entry.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(entry.timestamp)}
                      </span>
                      <SectionCount entry={entry} currentSections={page.sections.length} />
                      {entry.manifest && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                          {entry.manifest.style_paradigm ?? ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      title="Fork / branch from this version"
                    >
                      {expandedId === entry.id ? <ChevronUp className="w-3.5 h-3.5" /> : <GitFork className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleRevert(entry)}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      title="Restore this version"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Fork panel */}
                {expandedId === entry.id && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Fork as new project from this version:</p>
                    <div className="flex gap-1.5">
                      <input
                        value={forkName[entry.id] ?? ''}
                        onChange={(e) => setForkName((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                        placeholder={`${entry.label} (copy)`}
                        className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <button
                        onClick={() => handleFork(entry)}
                        className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-md font-medium transition-colors"
                      >
                        <GitFork className="w-3 h-3" /> Fork
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Creates a new project with this version&apos;s content{entry.manifest ? ' + design system' : ''}.
                      Current work is preserved.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
        <p className="text-[10px] text-gray-400">
          Up to 30 versions · auto-saved after generate &amp; regen · includes design system state
        </p>
      </div>
    </div>
  )
}
