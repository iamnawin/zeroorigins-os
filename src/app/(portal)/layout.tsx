export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505]">
      <header className="h-12 border-b border-border bg-[#090909] flex items-center px-6">
        <h1 className="text-sm font-bold tracking-wider text-zo-chrome">ZEROORIGINS</h1>
        <span className="text-[10px] text-muted-foreground ml-3 tracking-widest uppercase">Portal</span>
      </header>
      <main className="p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  )
}
