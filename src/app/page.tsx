import Link from 'next/link'
import { Zap, Wand2, Download, Layers, Database } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center px-6 text-white">
      <div className="max-w-3xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight">PageCraft</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
          Build beautiful Tailwind pages{' '}
          <span className="text-indigo-300">with AI</span>
        </h1>
        <p className="text-xl text-indigo-200 leading-relaxed mb-10 max-w-2xl mx-auto">
          Describe your page, watch AI generate every section live. Edit, regenerate individual sections, then export a single clean HTML file.
        </p>

        {/* CTA */}
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-indigo-50 transition shadow-xl"
        >
          <Wand2 className="w-5 h-5" /> Start Building Free
        </Link>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: <Wand2 className="w-5 h-5" />, title: 'AI Generation', desc: 'Describe your page — AI builds each section with real Tailwind CSS' },
            { icon: <Layers className="w-5 h-5" />, title: 'Section Editor', desc: 'Click any section to regenerate, tweak HTML, or reorder with drag & drop' },
            { icon: <Download className="w-5 h-5" />, title: 'Clean Export', desc: 'One-click export to a self-contained HTML file with Tailwind CDN' },
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
          <span className="text-indigo-600">·</span>
          <p className="text-xs text-indigo-400">
            Requires <code className="bg-white/10 px-1.5 py-0.5 rounded">OPENAI_API_KEY</code> in <code className="bg-white/10 px-1.5 py-0.5 rounded">.env.local</code>
          </p>
        </div>
      </div>
    </div>
  )
}
