import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ComingSoonProps {
  title: string
  description: string
  icon: LucideIcon
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center selection:bg-zo-purple/20">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-zo-purple/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-zo-purple/30 bg-zo-black-2">
          <Icon className="h-7 w-7 text-zo-purple" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-zo-chrome">{title}</h1>
      <span className="mt-3 rounded-full border border-zo-purple/30 bg-zo-purple/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zo-purple-2">
        Coming Soon
      </span>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-zo-muted">{description}</p>
      <Button variant="secondary" size="sm" className="mt-8">
        <Link href="/internal/control-room" className="flex items-center">
          <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Control Room
        </Link>
      </Button>
    </div>
  )
}
