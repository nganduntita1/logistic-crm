import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getClient } from '@/app/actions/clients'
import { createServerClient } from '@/lib/supabase/server'
import { ClientDetailView } from '@/components/clients/client-detail-view'
import type { Shipment } from '@/lib/types/database'

interface ClientDetailPageProps {
  params: { id: string }
}

/**
 * Client Detail Page
 * Validates: Requirements 3.4
 *
 * Displays full client information and their shipment history.
 */
export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { data: client, error } = await getClient(params.id)

  if (error || !client) {
    notFound()
  }

  // Fetch shipments for this client
  const supabase = await createServerClient()
  const { data: shipments } = await supabase
    .from('shipments')
    .select('id, tracking_number, description, status, payment_status, created_at')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>

      <ClientDetailView client={client} shipments={(shipments as Shipment[]) ?? []} />
    </div>
  )
}
