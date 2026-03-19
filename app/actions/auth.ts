'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ALLOWED_SELF_SIGNUP_ROLES: UserRole[] = ['operator', 'driver']
const DEFAULT_SELF_SIGNUP_ROLE: UserRole = 'operator'

function formatFallbackName(email: string) {
  const localPart = email.split('@')[0]?.trim()
  if (!localPart) return 'New User'
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

/**
 * Creates a profiles row for the currently authenticated user if one does not
 * already exist. Called from the browser after a successful sign-in or
 * sign-up so that authentication is always done with the browser client
 * (cookie propagation is handled by the browser, not a server action).
 * Returns { success: true } even if the profile already exists.
 */
export async function ensureProfile(fullName?: string, role?: UserRole) {
  try {
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
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (lookupError) return { error: lookupError.message }

    // Profile already exists — nothing to do.
    if (profile) {
      revalidatePath('/', 'layout')
      return { success: true }
    }

    // Create a new profile row.
    const email = user.email?.trim()
    if (!email) return { error: 'Account has no email address.' }

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

    revalidatePath('/', 'layout')
    return { success: true }
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

  return {
    ...user,
    profile,
  }
}
