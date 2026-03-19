import 'server-only'

import { nanoid } from 'nanoid'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import type {
  Organization,
  OrgMemberRole,
  UserRole,
} from '@/lib/types/database'

interface OrganizationMembershipRow {
  org_id: string
  role: OrgMemberRole
  organizations: Pick<Organization, 'id' | 'name' | 'slug'> | null
}

function slugifyOrganizationName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return `${base || 'workspace'}-${nanoid(6).toLowerCase()}`
}

function mapProfileRoleToOrgRole(role: UserRole): OrgMemberRole {
  if (role === 'admin') return 'admin'
  if (role === 'driver') return 'driver'
  return 'owner'
}

export async function ensureOrganizationForUser(params: {
  userId: string
  email: string
  fullName: string
  role: UserRole
}) {
  const adminSupabase = createAdminClient()

  const { data: existingMembership, error: membershipLookupError } = await adminSupabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', params.userId)
    .maybeSingle()

  if (membershipLookupError) {
    throw new Error(membershipLookupError.message)
  }

  if (existingMembership?.org_id) {
    return existingMembership.org_id
  }

  const workspaceName = `${params.fullName}'s Workspace`
  const slug = slugifyOrganizationName(params.email.split('@')[0] || params.fullName)

  const { data: organization, error: organizationError } = await adminSupabase
    .from('organizations')
    .insert({
      name: workspaceName,
      slug,
      owner_id: params.userId,
    })
    .select('id')
    .single()

  if (organizationError || !organization) {
    throw new Error(organizationError?.message || 'Failed to create organization')
  }

  const { error: membershipError } = await adminSupabase.from('org_members').insert({
    org_id: organization.id,
    user_id: params.userId,
    role: mapProfileRoleToOrgRole(params.role),
  })

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  return organization.id
}

export async function requireOrganizationContext() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(id, name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<OrganizationMembershipRow>()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership?.org_id || !membership.organizations) {
    throw new Error('No organization assigned to this user.')
  }

  return {
    supabase,
    user,
    organizationId: membership.org_id,
    organizationRole: membership.role,
    organization: membership.organizations,
  }
}