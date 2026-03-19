import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/config'

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv()
  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname.startsWith('/login')
  const isSignupPage = pathname.startsWith('/signup')
  const isAuthPage = isLoginPage || isSignupPage

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Route protection ---

  // Not logged in → redirect to /login (except for auth pages and API routes)
  if (
    !user &&
    !isAuthPage &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api')
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Already logged in → redirect away from auth pages to dashboard
  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // --- Role-based access control ---
  if (user) {
    let role: string | undefined

    try {
      const adminSupabase = createAdminClient()
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      role = profile?.role
    } catch {
      // Non-critical — allow the request through if we can't fetch the role.
    }

    if (role) {
      // Admin-only routes
      if (
        (pathname.startsWith('/drivers') || pathname.startsWith('/vehicles')) &&
        role !== 'admin'
      ) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
      }

      // Driver-only routes
      if (pathname.startsWith('/driver-portal') && role !== 'driver') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
      }

      // Drivers cannot access operator/admin routes
      if (
        (pathname.startsWith('/clients') ||
          pathname.startsWith('/shipments') ||
          pathname.startsWith('/trips') ||
          pathname.startsWith('/map')) &&
        role === 'driver'
      ) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/driver-portal'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return supabaseResponse
}
