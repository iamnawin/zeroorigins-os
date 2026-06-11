export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 zo-grid-pattern opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
