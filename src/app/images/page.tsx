'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, Sparkles, Image as ImageIcon, Copy, Download,
  ExternalLink, Loader2, X, Check, RefreshCw, Wand2, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import type { ImageResult } from '@/app/api/v2/images/route'

const SIZE_OPTIONS = [
  { value: '1792x1024', label: 'Landscape 16:9' },
  { value: '1024x1024', label: 'Square 1:1' },
  { value: '1024x1792', label: 'Portrait 9:16' },
] as const

const SOURCE_OPTIONS = [
  { value: 'both', label: 'All sources' },
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'pexels', label: 'Pexels' },
] as const

function ImageCard({ image, onCopy }: { image: ImageResult; onCopy: (url: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [loaded, setLoaded] = useState(false)

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      onCopy(url)
      toast.success('URL copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
      {/* Image */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        )}
        <img
          src={image.thumb}
          alt={image.alt}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => handleCopy(image.url)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        {/* Source badge */}
        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
          image.source === 'unsplash' ? 'bg-black/70 text-white' :
          image.source === 'pexels' ? 'bg-emerald-600/80 text-white' :
          'bg-violet-600/80 text-white'
        }`}>
          {image.source}
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <a
          href={image.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-gray-400 hover:text-gray-600 truncate"
        >
          {image.author}
        </a>
        <button
          onClick={() => handleCopy(image.url)}
          className={`flex-shrink-0 p-1 rounded transition-colors ${copied ? 'text-emerald-500' : 'text-gray-300 hover:text-indigo-500'}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function ImagesPage() {
  const [tab, setTab] = useState<'search' | 'generate' | 'recent'>('search')

  // Search state
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'both' | 'unsplash' | 'pexels'>('both')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ImageResult[]>([])
  const [searchError, setSearchError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Generate state
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState<'1792x1024' | '1024x1024' | '1024x1792'>('1792x1024')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<ImageResult[]>([])
  const [genError, setGenError] = useState('')

  // Recent state
  const [recent, setRecent] = useState<Array<{ url: string; alt: string; ts: number }>>([])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('image-recent')
      if (raw) setRecent(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  function addToRecent(url: string, alt: string) {
    setRecent(prev => {
      const next = [{ url, alt, ts: Date.now() }, ...prev.filter(r => r.url !== url)].slice(0, 40)
      localStorage.setItem('image-recent', JSON.stringify(next))
      return next
    })
  }

  async function handleSearch(newPage = 1) {
    if (!query.trim()) return
    setSearching(true)
    setSearchError('')
    if (newPage === 1) setResults([])
    try {
      const res = await fetch('/api/v2/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: query.trim(), source, page: newPage }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      const newResults: ImageResult[] = json.results ?? []
      setResults(prev => newPage === 1 ? newResults : [...prev, ...newResults])
      setHasMore(newResults.length >= 20)
      setPage(newPage)
    } catch (err) {
      setSearchError(String(err))
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/v2/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt: prompt.trim(), size }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      const img: ImageResult = json.image
      setGenerated(prev => [img, ...prev])
      addToRecent(img.url, img.alt)
      toast.success('Image generated!')
    } catch (err) {
      setGenError(String(err))
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">Image Library</span>
          </div>
          <div className="flex items-center gap-1 ml-4 bg-gray-100 rounded-xl p-1">
            {([
              { id: 'search', label: 'Search', icon: Search },
              { id: 'generate', label: 'AI Generate', icon: Sparkles },
              { id: 'recent', label: 'Recent', icon: Clock },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <span>Click any image to copy its URL</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ── Search Tab ── */}
        {tab === 'search' && (
          <div className="space-y-6">
            {/* Search bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                    placeholder="Search photos... e.g. 'modern office', 'abstract tech', 'nature landscape'"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                    autoFocus
                  />
                </div>
                <select
                  value={source}
                  onChange={e => setSource(e.target.value as typeof source)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {SOURCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSearch(1)}
                  disabled={searching || !query.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
              {/* Quick searches */}
              <div className="flex flex-wrap gap-2 mt-3">
                {['technology', 'business team', 'abstract gradient', 'nature', 'city skyline', 'dashboard UI', 'product mockup', 'dark background'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); setTimeout(() => handleSearch(1), 100) }}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs text-gray-600 transition-colors border border-gray-200 hover:border-indigo-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {searchError.includes('UNSPLASH_ACCESS_KEY') || searchError.includes('API') ? (
                  <span>Add <code className="bg-red-100 px-1 rounded">UNSPLASH_ACCESS_KEY</code> and/or <code className="bg-red-100 px-1 rounded">PEXELS_API_KEY</code> to your <code className="bg-red-100 px-1 rounded">.env.local</code></span>
                ) : searchError}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{results.length} images for <strong className="text-gray-700">"{query}"</strong></span>
                  <button onClick={() => { setResults([]); setQuery(''); inputRef.current?.focus() }} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {results.map(img => (
                    <ImageCard key={img.id} image={img} onCopy={url => addToRecent(url, img.alt)} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => handleSearch(page + 1)}
                      disabled={searching}
                      className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}

            {!searching && results.length === 0 && query && !searchError && (
              <div className="text-center py-16 text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}

            {!query && results.length === 0 && (
              <div className="text-center py-16 text-gray-300">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-gray-400">Search Unsplash & Pexels for free photos</p>
                <p className="text-xs mt-1">Requires UNSPLASH_ACCESS_KEY and/or PEXELS_API_KEY in .env.local</p>
              </div>
            )}
          </div>
        )}

        {/* ── Generate Tab ── */}
        {tab === 'generate' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-bold text-gray-900">DALL-E 3 Image Generator</span>
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Requires OPENAI_API_KEY</span>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the image you want... e.g. 'A modern SaaS dashboard on a dark background with purple accents, minimalist UI, photorealistic'"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-gray-50 resize-none"
              />
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Size:</span>
                  <div className="flex gap-1">
                    {SIZE_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setSize(o.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          size === o.value
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {generating ? 'Generating…' : 'Generate'}
                </button>
              </div>
              {/* Prompt suggestions */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Prompt ideas</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Modern SaaS dashboard dark UI, purple accents, photorealistic',
                    'Abstract tech background, blue gradient, geometric shapes',
                    'Business team collaborating, modern office, natural light',
                    'Minimalist product hero, white background, soft shadows',
                    'Futuristic data visualization, dark background, neon colors',
                    'Mobile app screenshot, clean UI, gradient background',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => setPrompt(s)}
                      className="px-2.5 py-1 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 rounded-lg text-xs text-gray-600 border border-gray-200 transition-colors text-left"
                    >
                      {s.slice(0, 50)}{s.length > 50 ? '…' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {genError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{genError}</div>
            )}

            {generated.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Generated images</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generated.map(img => (
                    <ImageCard key={img.id} image={img} onCopy={url => addToRecent(url, img.alt)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Recent Tab ── */}
        {tab === 'recent' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{recent.length} recently copied images</p>
              {recent.length > 0 && (
                <button
                  onClick={() => { localStorage.removeItem('image-recent'); setRecent([]) }}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-gray-400">No recent images yet</p>
                <p className="text-xs mt-1">Copy an image URL from Search or Generate to see it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {recent.map((img, i) => (
                  <ImageCard
                    key={i}
                    image={{ id: `recent-${i}`, url: img.url, thumb: img.url, alt: img.alt, author: '', authorUrl: '', source: 'unsplash', width: 0, height: 0 }}
                    onCopy={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
