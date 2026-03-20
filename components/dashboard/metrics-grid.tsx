'use client'

import { useEffect, useState, useCallback } from 'react'
import { Package, PackageCheck, Truck, DollarSign } from 'lucide-react'
import { MetricCard } from './metric-card'
import { getDashboardMetrics, type DashboardMetrics } from '@/app/actions/dashboard'

const REFRESH_INTERVAL = 30000

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

interface MetricsGridProps {
  initialMetrics?: DashboardMetrics | null
}

export function MetricsGrid({ initialMetrics = null }: MetricsGridProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    const result = await getDashboardMetrics()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setMetrics(result.data)
      setError(null)
    }
  }, [])

  useEffect(() => {
    if (!initialMetrics) {
      fetchMetrics()
    }
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMetrics, initialMetrics])

  if (error) {
    return (
      <p className="text-sm text-destructive">Failed to load metrics: {error}</p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="In Transit"
        value={metrics?.shipmentsInTransit ?? '—'}
        icon={Truck}
        description="Shipments currently on the road"
      />
      <MetricCard
        title="Delivered"
        value={metrics?.shipmentsDelivered ?? '—'}
        icon={PackageCheck}
        description="Successfully delivered shipments"
      />
      <MetricCard
        title="Active Trips"
        value={metrics?.activeTrips ?? '—'}
        icon={Package}
        description="Planned and in-progress trips"
      />
      <MetricCard
        title="Total Revenue"
        value={metrics ? formatCurrency(metrics.totalRevenue) : '—'}
        icon={DollarSign}
        description="Revenue from paid shipments"
      />
    </div>
  )
}
