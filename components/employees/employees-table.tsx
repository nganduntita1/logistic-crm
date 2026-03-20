'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { PaginationMeta } from '@/lib/pagination'
import type { OrganizationEmployee } from '@/lib/auth/org-user-management'

type EmployeeRole = 'operator' | 'driver' | 'admin'

interface EmployeesTableProps {
  employees: OrganizationEmployee[]
  pagination?: PaginationMeta
}

export function EmployeesTable({ employees, pagination }: EmployeesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [rolesByUser, setRolesByUser] = useState<Record<string, EmployeeRole>>(() =>
    employees.reduce<Record<string, EmployeeRole>>((acc, employee) => {
      acc[employee.userId] = employee.role
      return acc
    }, {})
  )

  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [employees]
  )

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.replace(`${pathname}?${params.toString()}`)
  }

  const post = async (url: string, payload: Record<string, string>, successMessage: string) => {
    setError('')
    setMessage('')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = (await response.json().catch(() => ({ error: 'Request failed.' }))) as {
      error?: string
    }

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Request failed.')
    }

    setMessage(successMessage)
  }

  const onUpdateRole = async (userId: string) => {
    const role = rolesByUser[userId]
    setBusyUserId(userId)

    try {
      await post(
        '/api/org-users/update-role',
        { userId, role },
        'Employee role updated successfully.'
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update role.')
    } finally {
      setBusyUserId(null)
    }
  }

  const onSendResetLink = async (userId: string) => {
    setBusyUserId(userId)

    try {
      await post(
        '/api/org-users/reset-password',
        { userId },
        'Password reset link sent to employee email.'
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to send reset link.')
    } finally {
      setBusyUserId(null)
    }
  }

  const onDeactivate = async (userId: string) => {
    const confirmed = window.confirm('Deactivate this employee? They will no longer access this organization.')
    if (!confirmed) return

    setBusyUserId(userId)
    try {
      await post('/api/org-users/deactivate', { userId }, 'Employee deactivated.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to deactivate employee.')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Added</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.length === 0 ? (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={5}>
                  No employees found.
                </td>
              </tr>
            ) : (
              sortedEmployees.map((employee) => {
                const isBusy = busyUserId === employee.userId
                return (
                  <tr key={employee.userId} className="border-t">
                    <td className="p-3">{employee.fullName}</td>
                    <td className="p-3">{employee.email}</td>
                    <td className="p-3">
                      <select
                        value={rolesByUser[employee.userId] || employee.role}
                        onChange={(event) =>
                          setRolesByUser((prev) => ({
                            ...prev,
                            [employee.userId]: event.target.value as EmployeeRole,
                          }))
                        }
                        className="h-9 rounded-md border border-input bg-background px-2"
                        disabled={isBusy}
                      >
                        <option value="operator">Operator</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3">{new Date(employee.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => onUpdateRole(employee.userId)} disabled={isBusy}>
                          Save Role
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onSendResetLink(employee.userId)} disabled={isBusy}>
                          Send Reset Link
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeactivate(employee.userId)} disabled={isBusy}>
                          Deactivate
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={updatePage}
        />
      )}
    </div>
  )
}
