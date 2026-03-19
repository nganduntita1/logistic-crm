import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with role
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    redirect("/login?error=profile_missing")
  }

  const userRole = profile.role as "admin" | "operator" | "driver"

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      <MobileNav userRole={userRole} />
      <div className="lg:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
