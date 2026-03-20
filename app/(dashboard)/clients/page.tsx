import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ClientsTable } from '@/components/clients/clients-table'
import { getPaginatedClients } from '@/app/actions/clients'

/**
 * Client List Page
 * Validates: Requirements 3.3
 *
 * Displays all clients in a searchable table with a "New Client" button
 */
export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string }
}) {
  const page = searchParams?.page
  const query = searchParams?.q ?? ''

  const { data: clients, pagination, error } = await getPaginatedClients({
    page: page ? Number(page) : 1,
    pageSize: 20,
    query,
  })

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error loading clients: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Link>
        </Button>
      </div>

      <ClientsTable clients={clients || []} pagination={pagination} initialQuery={query} />
    </div>
  )
}
