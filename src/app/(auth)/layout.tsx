export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] selection:bg-zo-purple/30">
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  )
}
