import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrganizationContext } from '@/lib/organizations'
import type { OrgMemberRole, UserRole } from '@/lib/types/database'

export type ManagedOrgUserRole = 'operator' | 'driver' | 'admin'

const INVITE_REDIRECT_URL =
  process.env.SUPABASE_INVITE_REDIRECT_URL?.trim() || 'https://nexuslogistic.netlify.app/login'

interface ProvisionUserParams {
  email: string
  fullName: string
  role: ManagedOrgUserRole
  password: string
}

interface OrgMembershipRow {
  user_id: string
  role: OrgMemberRole
  created_at: string
  profiles:
    | {
        id: string
        email: string
        full_name: string
        role: UserRole
        created_at: string
      }
    | {
        id: string
        email: string
        full_name: string
        role: UserRole
        created_at: string
      }[]
    | null
}

function getSingleProfile(profile: OrgMembershipRow['profiles']) {
  if (!profile) return null
  if (Array.isArray(profile)) return profile[0] ?? null
  return profile
}

export interface OrganizationEmployee {
  userId: string
  email: string
  fullName: string
  role: ManagedOrgUserRole
  membershipRole: OrgMemberRole
  createdAt: string
}

function mapManagedRoleToOrgRole(role: ManagedOrgUserRole): OrgMemberRole {
  if (role === 'admin') return 'admin'
  if (role === 'driver') return 'driver'
  return 'operator'
}

function sanitizeManagedRole(role: string): ManagedOrgUserRole | null {
  if (role === 'admin' || role === 'driver' || role === 'operator') {
    return role
  }

  return null
}

function mapOrgRoleToManagedRole(role: OrgMemberRole): ManagedOrgUserRole {
  if (role === 'admin' || role === 'owner') return 'admin'
  if (role === 'driver') return 'driver'
  return 'operator'
}

async function requireOrganizationAdminContext() {
  const context = await requireOrganizationContext()

  if (context.organizationRole !== 'owner' && context.organizationRole !== 'admin') {
    return { error: 'Only organization owners or admins can manage employees.' as const }
  }

  return { context }
}

export async function provisionOrganizationUser(params: ProvisionUserParams) {
  const email = params.email.trim().toLowerCase()
  const fullName = params.fullName.trim()
  const role = sanitizeManagedRole(params.role)
  const password = params.password.trim()

  if (!email || !email.includes('@')) {
    return { error: 'A valid email is required.' }
  }

  if (!fullName) {
    return { error: 'Full name is required.' }
  }

  if (!role) {
    return { error: 'Role must be one of: operator, driver, admin.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const authz = await requireOrganizationAdminContext()
  if ('error' in authz) {
    return { error: authz.error }
  }

  const { organizationId } = authz.context

  const adminSupabase = createAdminClient()

  const createUserResult = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  })

  if (createUserResult.error || !createUserResult.data.user?.id) {
    return { error: createUserResult.error?.message || 'Failed to create employee account.' }
  }

  const userId = createUserResult.data.user.id

  const { error: profileError } = await adminSupabase.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role: role as UserRole,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return { error: profileError.message }
  }

  const { error: membershipError } = await adminSupabase.from('org_members').upsert(
    {
      org_id: organizationId,
      user_id: userId,
      role: mapManagedRoleToOrgRole(role),
    },
    { onConflict: 'user_id' }
  )

  if (membershipError) {
    return { error: membershipError.message }
  }

  return {
    success: true,
    data: {
      userId,
      email,
      fullName,
      role,
      organizationId,
    },
  }
}

export async function listOrganizationEmployees() {
  const authz = await requireOrganizationAdminContext()
  if ('error' in authz) {
    return { error: authz.error }
  }

  const { organizationId } = authz.context
  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('org_members')
    .select('user_id, role, created_at, profiles!inner(id, email, full_name, role, created_at)')
    .eq('org_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  const employees: OrganizationEmployee[] = ((data ?? []) as OrgMembershipRow[])
    .map((row) => ({ row, profile: getSingleProfile(row.profiles) }))
    .filter((item) => !!item.profile)
    .map((item) => ({
      userId: item.row.user_id,
      email: item.profile!.email,
      fullName: item.profile!.full_name,
      role: mapOrgRoleToManagedRole(item.row.role),
      membershipRole: item.row.role,
      createdAt: item.row.created_at,
    }))

  return { data: employees }
}

export async function updateOrganizationEmployeeRole(params: {
  userId: string
  role: ManagedOrgUserRole
}) {
  const role = sanitizeManagedRole(params.role)
  if (!role) {
    return { error: 'Role must be one of: operator, driver, admin.' }
  }

  const authz = await requireOrganizationAdminContext()
  if ('error' in authz) {
    return { error: authz.error }
  }

  const { organizationId, user } = authz.context

  if (user.id === params.userId && role !== 'admin') {
    return { error: 'You cannot remove your own admin access from this screen.' }
  }

  const adminSupabase = createAdminClient()
  const orgRole = mapManagedRoleToOrgRole(role)

  const { error: membershipError } = await adminSupabase
    .from('org_members')
    .update({ role: orgRole })
    .eq('org_id', organizationId)
    .eq('user_id', params.userId)

  if (membershipError) {
    return { error: membershipError.message }
  }

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ role: role as UserRole, updated_at: new Date().toISOString() })
    .eq('id', params.userId)

  if (profileError) {
    return { error: profileError.message }
  }

  return { success: true }
}

export async function deactivateOrganizationEmployee(params: { userId: string }) {
  const authz = await requireOrganizationAdminContext()
  if ('error' in authz) {
    return { error: authz.error }
  }

  const { organizationId, user } = authz.context

  if (user.id === params.userId) {
    return { error: 'You cannot deactivate your own account.' }
  }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('org_members')
    .delete()
    .eq('org_id', organizationId)
    .eq('user_id', params.userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function resendOrganizationEmployeeInvite(params: { userId: string }) {
  const authz = await requireOrganizationAdminContext()
  if ('error' in authz) {
    return { error: authz.error }
  }

  const { organizationId } = authz.context
  const adminSupabase = createAdminClient()

  const { data: membership, error: membershipError } = await adminSupabase
    .from('org_members')
    .select('user_id, profiles!inner(email)')
    .eq('org_id', organizationId)
    .eq('user_id', params.userId)
    .maybeSingle()

  if (membershipError) {
    return { error: membershipError.message }
  }

  const relation = (membership as { profiles?: OrgMembershipRow['profiles'] } | null)?.profiles ?? null
  const email = getSingleProfile(relation)?.email
  if (!email) {
    return { error: 'Could not find employee email for this organization user.' }
  }

  const generateLinkResult = await adminSupabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: INVITE_REDIRECT_URL,
    },
  })

  if (generateLinkResult.error) {
    const resetResult = await adminSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: INVITE_REDIRECT_URL,
    })

    if (resetResult.error) {
      return { error: resetResult.error.message }
    }
  }

  return { success: true }
}