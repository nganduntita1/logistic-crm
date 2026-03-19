'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { HighlightText } from '@/components/shared/highlight-text'
import { searchClients } from '@/app/actions/clients'
import type { Client } from '@/lib/types/database'

interface ClientsTableProps {
  clients: Client[]
}

/**
 * Clients Table Component
 * Validates: Requirements 3.3, 12.2, 12.4
 * 
 * Displays clients in a searchable table with navigation to detail pages
 */
export function ClientsTable({ clients: initialClients }: ClientsTableProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Handle search with debouncing (handled by SearchInput)
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    const { data, error } = await searchClients(query)
    
    if (!error && data) {
      setClients(data)
    }
    setIsSearching(false)
  }, [])

  // Navigate to client detail page on row click
  const handleRowClick = (client: Client) => {
    router.push(`/clients/${client.id}`)
  }

  // Define table columns
  const columns: ColumnDef<Client>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (client) => <HighlightText text={client.name} highlight={searchQuery} />,
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      cell: (client) => <HighlightText text={client.phone} highlight={searchQuery} />,
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
      {/* Search Input */}
      <SearchInput
        placeholder="Search by name or phone..."
        onSearch={handleSearch}
        className="max-w-sm"
      />

      {isSearching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {/* Data Table */}
      <DataTable
        data={clients}
        columns={columns}
        onRowClick={handleRowClick}
        itemsPerPage={20}
      />
    </div>
  )
}
