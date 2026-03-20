import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DriversTable } from '@/components/drivers/drivers-table'
import { getPaginatedDrivers } from '@/app/actions/drivers'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Driver List Page (Admin only)
 * Validates: Requirements 6.5
 *
 * Displays all drivers in a DataTable with assigned vehicle info.
 */
export default async function DriversPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string }
}) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

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

  const { data: drivers, pagination, error } = await getPaginatedDrivers({
    page: searchParams?.page ? Number(searchParams.page) : 1,
    pageSize: 20,
    query: searchParams?.q ?? '',
  })

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error loading drivers: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground">Manage your driver roster</p>
        </div>
        <Button asChild>
          <Link href="/drivers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Driver
          </Link>
        </Button>
      </div>

      <DriversTable
        drivers={drivers ?? []}
        pagination={pagination}
        initialQuery={searchParams?.q ?? ''}
      />
    </div>
  )
}
