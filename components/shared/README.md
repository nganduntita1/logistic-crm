# Shared UI Components

This directory contains reusable UI components used across the logistics CRM application.

## DataTable

A generic, reusable table component with sorting, filtering, and pagination capabilities.

### Features
- Generic TypeScript support for type-safe data
- Column-based sorting (ascending/descending)
- Search functionality with customizable search key
- Multiple filter options with dropdown selects
- Pagination with configurable items per page
- Row click handlers for navigation
- Responsive design

### Usage

```tsx
import { DataTable, ColumnDef } from '@/components/shared'

interface Client {
  id: string
  name: string
  phone: string
  email: string
  city: string
}

const columns: ColumnDef<Client>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email', sortable: true },
  { 
    key: 'city', 
    header: 'City',
    cell: (row) => <span className="capitalize">{row.city}</span>
  },
]

const filterOptions = [
  {
    key: 'city',
    label: 'Filter by City',
    options: [
      { value: 'johannesburg', label: 'Johannesburg' },
      { value: 'lubumbashi', label: 'Lubumbashi' },
      { value: 'kinshasa', label: 'Kinshasa' },
    ],
  },
]

export function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <DataTable
      data={clients}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Search clients..."
      filterOptions={filterOptions}
      onRowClick={(client) => router.push(`/clients/${client.id}`)}
      itemsPerPage={20}
    />
  )
}
```

## SearchInput

A debounced search input component that delays search execution until the user stops typing.

### Features
- Configurable debounce delay (default 300ms)
- Search icon indicator
- Controlled input with callback
- Prevents excessive API calls

### Usage

```tsx
import { SearchInput } from '@/components/shared'

export function ShipmentSearch() {
  const handleSearch = (query: string) => {
    // Perform search with the query
    console.log('Searching for:', query)
  }

  return (
    <SearchInput
      placeholder="Search by tracking number..."
      onSearch={handleSearch}
      debounceMs={300}
      className="max-w-md"
    />
  )
}
```

## StatusBadge

Visual indicators for shipment statuses with color coding.

### Features
- Predefined colors for each status
- Consistent styling across the app
- Supports shipment and payment statuses

### Usage

```tsx
import { StatusBadge, PaymentStatusBadge } from '@/components/shared'

export function ShipmentRow({ shipment }) {
  return (
    <div>
      <StatusBadge status={shipment.status} />
      <PaymentStatusBadge status={shipment.payment_status} />
    </div>
  )
}
```

### Status Colors
- **Pending**: Gray outline
- **In Transit**: Yellow/Warning
- **Delivered**: Green/Success
- **Cancelled**: Red/Destructive

### Payment Status Colors
- **Unpaid**: Red/Destructive
- **Partial**: Yellow/Warning
- **Paid**: Green/Success

## TripStatusBadge

Visual indicators for trip statuses with color coding.

### Features
- Predefined colors for each trip status
- Consistent with shipment status styling

### Usage

```tsx
import { TripStatusBadge } from '@/components/shared'

export function TripRow({ trip }) {
  return (
    <div>
      <TripStatusBadge status={trip.status} />
    </div>
  )
}
```

### Status Colors
- **Planned**: Gray outline
- **In Progress**: Yellow/Warning
- **Completed**: Green/Success
- **Cancelled**: Red/Destructive

## Design Principles

All shared components follow these principles:

1. **Type Safety**: Full TypeScript support with proper type definitions
2. **Reusability**: Generic and configurable for multiple use cases
3. **Accessibility**: Semantic HTML and keyboard navigation support
4. **Responsive**: Mobile-first design with TailwindCSS
5. **Consistency**: Uses ShadCN UI components as foundation
6. **Performance**: Optimized with React.useMemo and proper memoization
