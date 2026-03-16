import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'

interface PageTopbarProps {
  title: string
  icon?: React.ReactNode
  backHref?: string
  backLabel?: string
  right?: React.ReactNode
}

export function PageTopbar({ title, icon, backHref = '/', backLabel = 'Home', right }: PageTopbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base tracking-tight text-gray-900">wbuilder</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-500">{title}</span>
            {icon && <span className="text-gray-300 ml-1">{icon}</span>}
          </div>
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </div>
    </header>
  )
}
