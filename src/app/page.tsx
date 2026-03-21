import Link from 'next/link'
import { Zap, Wand2, Download, Layers, Database, Sparkles, FolderOpen, Image as ImageIcon } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center px-6 text-white">
      <div className="max-w-3xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight">wbuilder</span>
          <span className="text-sm text-indigo-400 font-medium">v2</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
          Build beautiful sites{' '}
          <span className="text-indigo-300">with AI</span>
        </h1>
        <p className="text-xl text-indigo-200 leading-relaxed mb-10 max-w-2xl mx-auto">
          Answer a few questions, watch AI generate every section live — with design tokens, style paradigms and a 3-pass quality pipeline.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/briefing-v3"
            className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-bold text-lg px-8 py-4 rounded-2xl transition shadow-xl"
          >
            <Sparkles className="w-5 h-5" /> Hero Generator v3
          </Link>
          <Link
            href="/briefing"
            className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-50 transition shadow-xl"
          >
            <Zap className="w-5 h-5" /> Builder v2
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition backdrop-blur"
          >
            <FolderOpen className="w-5 h-5" /> My Projects
          </Link>
        </div>
        <div className="text-xs text-indigo-300 mb-12">
          v3: Briefing → Moodboard → 8-Call AI Pipeline → Hero HTML
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Wand2 className="w-5 h-5" />, title: 'AI Generation', desc: '3-pass pipeline: structure → visual layer → validation. Real Tailwind + CSS Custom Properties.' },
            { icon: <Layers className="w-5 h-5" />, title: 'Multi-page Sites', desc: 'Define all pages in the briefing. Each page gets its own sections, generated independently.' },
            { icon: <Download className="w-5 h-5" />, title: 'Clean Export', desc: 'One-click export to a self-contained HTML file with Tailwind CDN.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/40 flex items-center justify-center mb-3 text-indigo-200">
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-indigo-200 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/scraper"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium transition-colors"
          >
            <Database className="w-4 h-4" /> Block Library & Scraper
          </Link>
          <Link
            href="/images"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium transition-colors"
          >
            <ImageIcon className="w-4 h-4" /> Image Library
          </Link>
        </div>
      </div>
    </div>
  )
}
