import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: partner } = await supabase.from('partners').select('*').eq('id', id).single()
  if (!partner) notFound()

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/internal/partners">
        <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
      </Link>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zo-chrome">{partner.name}</CardTitle>
            <Badge>{partner.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {partner.email}</div>
            <div><span className="text-muted-foreground">Company:</span> {partner.company || '—'}</div>
            <div><span className="text-muted-foreground">Type:</span> {partner.type || '—'}</div>
          </div>
          {partner.pitch && <p className="text-sm text-muted-foreground border-t border-border pt-3">{partner.pitch}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
