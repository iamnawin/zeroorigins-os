import { InternalSidebar } from '@/components/layout/internal-sidebar'
import { InternalHeader } from '@/components/layout/internal-header'

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505]">
      <InternalSidebar />
      <div className="ml-60">
        <InternalHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
