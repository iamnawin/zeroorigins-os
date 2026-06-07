export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-zo-chrome tracking-wider">ZEROORIGINS</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
