'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { HighlightText } from '@/components/shared/highlight-text'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { PaginationMeta } from '@/lib/pagination'
import type { Client } from '@/lib/types/database'

interface ClientsTableProps {
  clients: Client[]
  pagination?: PaginationMeta
  initialQuery?: string
}

/**
 * Clients Table Component
 * Validates: Requirements 3.3, 12.2, 12.4
 *
 * Displays clients in a searchable table with navigation to detail pages
 */
export function ClientsTable({ clients, pagination, initialQuery = '' }: ClientsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  const handleRowClick = (client: Client) => {
    router.push(`/clients/${client.id}`)
  }

  const columns: ColumnDef<Client>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (client) => <HighlightText text={client.name} highlight={initialQuery} />,
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      cell: (client) => <HighlightText text={client.phone} highlight={initialQuery} />,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      cell: (client) => client.email || '-',
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      cell: (client) => client.city || '-',
    },
    {
      key: 'country',
      header: 'Country',
      sortable: true,
      cell: (client) => client.country || '-',
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      cell: (client) => new Date(client.created_at).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by name or phone..."
        onSearch={(query) => updateQueryParams({ q: query.trim() || null, page: '1' })}
        defaultValue={initialQuery}
        className="max-w-sm"
      />

      <DataTable
        data={clients}
        columns={columns}
        onRowClick={handleRowClick}
        itemsPerPage={20}
      />

      {pagination && (
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={(page) => updateQueryParams({ page: String(page) })}
        />
      )}
    </div>
  )
}
