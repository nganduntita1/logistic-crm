import { ClientForm } from '@/components/clients/client-form'

/**
 * New Client Page
 * Validates: Requirements 3.1
 *
 * Renders the ClientForm in creation mode (no client prop).
 */
export default function NewClientPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Client</h1>
        <p className="text-muted-foreground">Add a new client to your database</p>
      </div>
      <ClientForm />
    </div>
  )
}
