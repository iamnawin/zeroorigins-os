export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zo-chrome">ZeroOrigins OS</h1>
          <p className="text-sm text-muted-foreground mt-1">Company Operating System</p>
        </div>
        {children}
      </div>
    </div>
  )
}
