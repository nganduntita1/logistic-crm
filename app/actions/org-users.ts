'use server'

import { revalidatePath } from 'next/cache'
import {
  deactivateOrganizationEmployee,
  listOrganizationEmployees,
  listPaginatedOrganizationEmployees,
  provisionOrganizationUser,
  resendOrganizationEmployeeInvite,
  type ManagedOrgUserRole,
  updateOrganizationEmployeeRole,
} from '@/lib/auth/org-user-management'

export async function createOrganizationUser(formData: FormData) {
  const email = String(formData.get('email') || '')
  const fullName = String(formData.get('full_name') || '')
  const role = String(formData.get('role') || '') as ManagedOrgUserRole
  const password = String(formData.get('password') || '')

  const result = await provisionOrganizationUser({ email, fullName, role, password })

  if (result.success) {
    revalidatePath('/employees')
    revalidatePath('/drivers')
    revalidatePath('/dashboard')
  }

  return result
}

export async function getOrganizationEmployees() {
  return await listOrganizationEmployees()
}

export async function getPaginatedOrganizationEmployees(params?: {
  page?: number
  pageSize?: number
}) {
  return await listPaginatedOrganizationEmployees(params)
}

export async function changeOrganizationEmployeeRole(formData: FormData) {
  const userId = String(formData.get('user_id') || '')
  const role = String(formData.get('role') || '') as ManagedOrgUserRole

  const result = await updateOrganizationEmployeeRole({ userId, role })

  if (result.success) {
    revalidatePath('/employees')
    revalidatePath('/drivers')
    revalidatePath('/dashboard')
  }

  return result
}

export async function deactivateEmployee(formData: FormData) {
  const userId = String(formData.get('user_id') || '')

  const result = await deactivateOrganizationEmployee({ userId })

  if (result.success) {
    revalidatePath('/employees')
    revalidatePath('/drivers')
    revalidatePath('/dashboard')
  }

  return result
}

export async function resendEmployeeInvite(formData: FormData) {
  const userId = String(formData.get('user_id') || '')

  const result = await resendOrganizationEmployeeInvite({ userId })

  return result
}