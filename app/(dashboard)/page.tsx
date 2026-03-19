import { Header } from '@/components/layout/header'
import { MetricsGrid } from '@/components/dashboard/metrics-grid'
import { ShipmentStatusChart } from '@/components/dashboard/shipment-status-chart'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopRoutesChart } from '@/components/dashboard/top-routes-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { OngoingTrips } from '@/components/dashboard/ongoing-trips'
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <Header
        title="Dashboard"
        userName={profile?.full_name}
        userRole={profile?.role}
      />
      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <MetricsGrid />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ShipmentStatusChart />
          <RevenueChart />
        </div>

        {/* Top Routes, Ongoing Trips and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TopRoutesChart />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <OngoingTrips />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  )
}
