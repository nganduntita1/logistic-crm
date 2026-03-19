import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { ShipmentForm } from '@/components/shipments/shipment-form'
import { getClients } from '@/app/actions/clients'
import { getReceivers } from '@/app/actions/receivers'
import { createServerClient } from '@/lib/supabase/server'
import type { Trip } from '@/lib/types/database'

/**
 * New Shipment Page
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 18.3
 */
export default async function NewShipmentPage() {
  const [{ data: clients }, { data: receivers }] = await Promise.all([
    getClients(),
    getReceivers(),
  ])

  const supabase = await createServerClient()
  const { data: trips } = await supabase
    .from('trips')
    .select('id, route, departure_date, status')
    .in('status', ['planned', 'in_progress'])
    .order('departure_date', { ascending: true })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Shipment</h1>
        <p className="text-muted-foreground">Create a new cargo shipment</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentForm
            clients={clients ?? []}
            receivers={receivers ?? []}
            trips={(trips as Trip[]) ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
