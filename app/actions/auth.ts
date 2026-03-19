'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { ensureAuthenticatedProfile } from '@/lib/auth/ensure-profile'
import { createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Creates a profiles row for the currently authenticated user if one does not
 * already exist. Called from the browser after a successful sign-in or
 * sign-up so that authentication is always done with the browser client
 * (cookie propagation is handled by the browser, not a server action).
 * Returns { success: true } even if the profile already exists.
 */
export async function ensureProfile(fullName?: string, role?: UserRole) {

  try {
    const result = await ensureAuthenticatedProfile(fullName, role)
    if (result.error) {
      return result
    }

    revalidatePath('/', 'layout')
    return result
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unexpected error during profile setup.',
    }
  }
}

export async function signOut() {

  const supabase = await createServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getSession() {

  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

export async function getUser() {

  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(id, name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return {
    ...user,
    profile,
    organizationMembership: membership,
  }
}
