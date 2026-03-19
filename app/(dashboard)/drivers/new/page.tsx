import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DriverForm } from '@/components/drivers/driver-form'
import { getDriverProfiles } from '@/app/actions/drivers'
import { getVehicles } from '@/app/actions/vehicles'
import { createServerClient } from '@/lib/supabase/server'

/**
 * New Driver Page (Admin only)
 * Validates: Requirements 6.1
 */
export default async function NewDriverPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const [{ data: profiles }, { data: vehicles }] = await Promise.all([
    getDriverProfiles(),
    getVehicles(),
  ])

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/drivers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drivers
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Driver</h1>
        <p className="text-muted-foreground">Add a new driver to the system</p>
      </div>

      <DriverForm profiles={profiles ?? []} vehicles={vehicles ?? []} />
    </div>
  )
}
