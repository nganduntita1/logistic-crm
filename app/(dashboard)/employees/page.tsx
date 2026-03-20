import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getPaginatedOrganizationEmployees } from '@/app/actions/org-users'
import { AddEmployeeDialog } from '@/components/layout/add-employee-dialog'
import { EmployeesTable } from '@/components/employees/employees-table'

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: { page?: string }
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

  const { data: employees, pagination, error } = await getPaginatedOrganizationEmployees({
    page: searchParams?.page ? Number(searchParams.page) : 1,
    pageSize: 20,
  })

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error loading employees: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Create and manage your organization staff accounts.</p>
        </div>
        <AddEmployeeDialog triggerClassName="justify-start" />
      </div>

      <EmployeesTable employees={employees ?? []} pagination={pagination} />
    </div>
  )
}
