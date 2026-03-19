import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getDriver, getDriverProfiles } from '@/app/actions/drivers'
import { getVehicles } from '@/app/actions/vehicles'
import { DriverForm } from '@/components/drivers/driver-form'
import { createServerClient } from '@/lib/supabase/server'

interface EditDriverPageProps {
  params: { id: string }
}

/**
 * Edit Driver Page (Admin only)
 * Validates: Requirements 6.1, 6.6
 */
export default async function EditDriverPage({ params }: EditDriverPageProps) {
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

  const [{ data: driver, error }, { data: profiles }, { data: vehicles }] = await Promise.all([
    getDriver(params.id),
    getDriverProfiles(),
    getVehicles(),
  ])

  if (error || !driver) {
    notFound()
  }

  const driverProfile = driver.profile as { full_name: string; email: string } | undefined

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/drivers/${driver.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Driver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Driver</h1>
        <p className="text-muted-foreground">
          {driverProfile?.full_name ?? 'Update driver details'}
        </p>
      </div>

      <DriverForm
        driver={driver}
        profiles={profiles ?? []}
        vehicles={vehicles ?? []}
      />
    </div>
  )
}
