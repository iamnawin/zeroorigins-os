import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] selection:bg-zo-purple/30 overflow-hidden">
      {/* Ambient violet glow — pure CSS, no animation cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.10), transparent 70%)',
        }}
      />
      <div className="relative w-full max-w-md p-8 space-y-8">
        <Link href="/" className="flex justify-center">
          <div className="relative w-14 h-14">
            <Image src="/logo.png" alt="ZeroOrigins" fill className="object-contain" priority />
          </div>
        </Link>
        {children}
      </div>
    </div>
  )
}
