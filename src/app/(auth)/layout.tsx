import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-8 gap-3">
          <div className="relative w-16 h-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zo-chrome">ZeroOrigins OS</h1>
            <p className="text-sm text-muted-foreground mt-1">Company Operating System</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
