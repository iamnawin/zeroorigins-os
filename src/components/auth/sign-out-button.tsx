'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface SignOutButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function SignOutButton({ className, variant = 'outline' }: SignOutButtonProps) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleSignOut} 
      className={className}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  )
}
