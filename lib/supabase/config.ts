export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server.'
    )
  }

  if (!url.startsWith('https://')) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL. It must start with https://')
  }

  return { url, anonKey }
}

export function getSupabaseServiceRoleEnv() {
  const { url } = getSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role configuration. Set SUPABASE_SERVICE_ROLE_KEY in .env.local and restart the dev server.'
    )
  }

  return { url, serviceRoleKey }
}
