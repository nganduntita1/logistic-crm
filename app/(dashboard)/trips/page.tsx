import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TripsTable } from '@/components/trips/trips-table'
import { getTrips } from '@/app/actions/trips'

/**
 * Trip List Page
 * Validates: Requirements 5.4
 *
 * Displays all trips with driver/vehicle assignments and status filter.
 */
export default async function TripsPage() {
  const { data: trips, error } = await getTrips()

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error loading trips: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">Plan and manage cargo trips</p>
        </div>
        <Button asChild>
          <Link href="/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            New Trip
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading trips...</div>}>
        <TripsTable trips={trips ?? []} />
      </Suspense>
    </div>
  )
}
