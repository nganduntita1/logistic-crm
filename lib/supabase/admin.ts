import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleEnv } from '@/lib/supabase/config'

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleEnv()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}