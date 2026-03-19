import 'server-only'

import { ensureOrganizationForUser } from '@/lib/organizations'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'

const ALLOWED_SELF_SIGNUP_ROLES: UserRole[] = ['operator', 'driver']
const DEFAULT_SELF_SIGNUP_ROLE: UserRole = 'operator'

function formatFallbackName(email: string) {
  const localPart = email.split('@')[0]?.trim()
  if (!localPart) return 'New User'
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export async function ensureAuthenticatedProfile(fullName?: string, role?: UserRole) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Not authenticated. Please sign in again.' }
  }

  const adminSupabase = createAdminClient()

  const { data: profile, error: lookupError } = await adminSupabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (lookupError) return { error: lookupError.message }

  const email = user.email?.trim()
  if (!email) return { error: 'Account has no email address.' }

  if (profile) {
    await ensureOrganizationForUser({
      userId: user.id,
      email,
      fullName: profile.full_name,
      role: profile.role,
    })

    return { success: true }
  }

  const name = fullName?.trim() || formatFallbackName(email)
  const assignedRole: UserRole =
    role && ALLOWED_SELF_SIGNUP_ROLES.includes(role) ? role : DEFAULT_SELF_SIGNUP_ROLE

  const { error: insertError } = await adminSupabase.from('profiles').insert({
    id: user.id,
    email,
    full_name: name,
    role: assignedRole,
  })

  if (insertError) return { error: insertError.message }

  await ensureOrganizationForUser({
    userId: user.id,
    email,
    fullName: name,
    role: assignedRole,
  })

  return { success: true }
}