'use server'

import { requireOrganizationContext } from '@/lib/organizations'

export interface DashboardMetrics {
  shipmentsInTransit: number
  shipmentsDelivered: number
  activeTrips: number
  totalRevenue: number
}

export interface ShipmentStatusData {
  pending: number
  in_transit: number
  delivered: number
  cancelled: number
}

export interface RevenueChartData {
  date: string
  revenue: number
}

export interface RouteData {
  route: string
  count: number
}

export interface RecentShipment {
  id: string
  tracking_number: string
  status: string
  payment_status: string
  client_name: string
  created_at: string
}

export interface OngoingTrip {
  id: string
  route: string
  departure_date: string
  expected_arrival: string
  status: 'in_progress'
  driver_name: string
  vehicle_plate: string | null
}

export interface DashboardInitialData {
  metrics: DashboardMetrics | null
  shipmentStatus: ShipmentStatusData | null
  revenueChart: RevenueChartData[]
  topRoutes: RouteData[]
  recentShipments: RecentShipment[]
  ongoingTrips: OngoingTrip[]
}

/**
 * Fetch dashboard payload for first render in a single context to reduce
 * repeated auth/org lookups and improve first paint time.
 */
export async function getDashboardInitialData(): Promise<{
  data?: DashboardInitialData
  error?: string
}> {
  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      inTransitResult,
      deliveredResult,
      activeTripsResult,
      revenueResult,
      pendingResult,
      cancelledStatusResult,
      revenueSeriesResult,
      topRoutesResult,
      recentShipmentsResult,
      ongoingTripsResult,
    ] = await Promise.all([
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'in_transit'),
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'delivered'),
      supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .in('status', ['planned', 'in_progress']),
      supabase
        .from('shipments')
        .select('price')
        .eq('org_id', organizationId)
        .eq('payment_status', 'paid'),
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'pending'),
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'cancelled'),
      supabase
        .from('shipments')
        .select('price, created_at')
        .eq('org_id', organizationId)
        .eq('payment_status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('shipments')
        .select('trip:trip_id(route)')
        .eq('org_id', organizationId),
      supabase
        .from('shipments')
        .select('id, tracking_number, status, payment_status, client:client_id(name), created_at')
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('trips')
        .select('id, route, departure_date, expected_arrival, status, driver:driver_id(profile:user_id(full_name)), vehicle:vehicle_id(plate_number)')
        .eq('org_id', organizationId)
        .eq('status', 'in_progress')
        .order('departure_date', { ascending: true })
        .limit(6),
    ])

    const hasError = [
      inTransitResult,
      deliveredResult,
      activeTripsResult,
      revenueResult,
      pendingResult,
      cancelledStatusResult,
      revenueSeriesResult,
      topRoutesResult,
      recentShipmentsResult,
      ongoingTripsResult,
    ].find((result) => result.error)

    if (hasError?.error) {
      return { error: hasError.error.message }
    }

    const totalRevenue = (revenueResult.data ?? []).reduce(
      (sum, shipment) => sum + (shipment.price ?? 0),
      0
    )

    const revenueByDate: Record<string, number> = {}
    revenueSeriesResult.data?.forEach((shipment) => {
      const date = new Date(shipment.created_at).toLocaleDateString('en-ZA')
      revenueByDate[date] = (revenueByDate[date] ?? 0) + (shipment.price ?? 0)
    })

    const revenueChart = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }))

    const routeMap: Record<string, number> = {}
    topRoutesResult.data?.forEach((shipment: any) => {
      const route = shipment.trip?.route
      if (route) {
        routeMap[route] = (routeMap[route] ?? 0) + 1
      }
    })

    const topRoutes = Object.entries(routeMap)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const recentShipments: RecentShipment[] = (recentShipmentsResult.data ?? []).map((s: any) => ({
      id: s.id,
      tracking_number: s.tracking_number,
      status: s.status,
      payment_status: s.payment_status,
      client_name: s.client?.name ?? 'Unknown',
      created_at: s.created_at,
    }))

    const ongoingTrips: OngoingTrip[] = (ongoingTripsResult.data ?? []).map((trip: any) => ({
      id: trip.id,
      route: trip.route,
      departure_date: trip.departure_date,
      expected_arrival: trip.expected_arrival,
      status: 'in_progress',
      driver_name: trip.driver?.profile?.full_name ?? 'Unassigned',
      vehicle_plate: trip.vehicle?.plate_number ?? null,
    }))

    return {
      data: {
        metrics: {
          shipmentsInTransit: inTransitResult.count ?? 0,
          shipmentsDelivered: deliveredResult.count ?? 0,
          activeTrips: activeTripsResult.count ?? 0,
          totalRevenue,
        },
        shipmentStatus: {
          pending: pendingResult.count ?? 0,
          in_transit: inTransitResult.count ?? 0,
          delivered: deliveredResult.count ?? 0,
          cancelled: cancelledStatusResult.count ?? 0,
        },
        revenueChart,
        topRoutes,
        recentShipments,
        ongoingTrips,
      },
    }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch dashboard initial data' }
  }
}

/**
 * Fetch all key dashboard metrics in parallel
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 17.3
 */
export async function getDashboardMetrics(): Promise<{ data?: DashboardMetrics; error?: string }> {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const [inTransitResult, deliveredResult, activeTripsResult, revenueResult] = await Promise.all([
      // Count shipments currently in transit (Requirement 2.1)
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'in_transit'),

      // Count delivered shipments (Requirement 2.2)
      supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .eq('status', 'delivered'),

      // Count active trips (planned + in_progress) (Requirement 2.3)
      supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', organizationId)
        .in('status', ['planned', 'in_progress']),

      // Sum revenue from paid shipments (Requirements 2.4, 17.3)
      supabase
        .from('shipments')
        .select('price')
        .eq('org_id', organizationId)
        .eq('payment_status', 'paid'),
    ])

    if (inTransitResult.error) return { error: inTransitResult.error.message }
    if (deliveredResult.error) return { error: deliveredResult.error.message }
    if (activeTripsResult.error) return { error: activeTripsResult.error.message }
    if (revenueResult.error) return { error: revenueResult.error.message }

    const totalRevenue = (revenueResult.data ?? []).reduce(
      (sum, s) => sum + (s.price ?? 0),
      0
    )

    return {
      data: {
        shipmentsInTransit: inTransitResult.count ?? 0,
        shipmentsDelivered: deliveredResult.count ?? 0,
        activeTrips: activeTripsResult.count ?? 0,
        totalRevenue,
      },
    }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch dashboard metrics' }
  }
}

/**
 * Fetch shipments grouped by status for pie chart
 */
export async function getShipmentsByStatus(): Promise<{ data?: ShipmentStatusData; error?: string }> {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const statuses = ['pending', 'in_transit', 'delivered', 'cancelled']
    const results = await Promise.all(
      statuses.map((status) =>
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', organizationId)
          .eq('status', status)
      )
    )

    const data: ShipmentStatusData = {
      pending: results[0].count ?? 0,
      in_transit: results[1].count ?? 0,
      delivered: results[2].count ?? 0,
      cancelled: results[3].count ?? 0,
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch shipment status data' }
  }
}

/**
 * Fetch revenue data for the last 30 days
 */
export async function getRevenueChart(): Promise<{ data?: RevenueChartData[]; error?: string }> {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('price, created_at')
      .eq('org_id', organizationId)
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) return { error: error.message }

    // Group by date
    const revenueByDate: Record<string, number> = {}
    shipments?.forEach((shipment) => {
      const date = new Date(shipment.created_at).toLocaleDateString('en-ZA')
      revenueByDate[date] = (revenueByDate[date] ?? 0) + (shipment.price ?? 0)
    })

    const data = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }))

    return { data }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch revenue data' }
  }
}

/**
 * Fetch top routes by shipment count
 */
export async function getTopRoutes(): Promise<{ data?: RouteData[]; error?: string }> {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('trip:trip_id(route)')
      .eq('org_id', organizationId)

    if (error) return { error: error.message }

    // Count shipments per route
    const routeMap: Record<string, number> = {}
    shipments?.forEach((shipment: any) => {
      const route = shipment.trip?.route
      if (route) {
        routeMap[route] = (routeMap[route] ?? 0) + 1
      }
    })

    const data = Object.entries(routeMap)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { data }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch route data' }
  }
}

/**
 * Fetch recent shipments for activity feed
 */
export async function getRecentShipments(limit = 5): Promise<{ data?: RecentShipment[]; error?: string }> {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('id, tracking_number, status, payment_status, client:client_id(name), created_at')
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { error: error.message }

    const data = (shipments ?? []).map((s: any) => ({
      id: s.id,
      tracking_number: s.tracking_number,
      status: s.status,
      payment_status: s.payment_status,
      client_name: s.client?.name ?? 'Unknown',
      created_at: s.created_at,
    }))

    return { data }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch recent shipments' }
  }
}

/**
 * Fetch ongoing (in-progress) trips for dashboard overview
 */
export async function getOngoingTrips(limit = 6): Promise<{ data?: OngoingTrip[]; error?: string }> {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, route, departure_date, expected_arrival, status, driver:driver_id(profile:user_id(full_name)), vehicle:vehicle_id(plate_number)')
      .eq('org_id', organizationId)
      .eq('status', 'in_progress')
      .order('departure_date', { ascending: true })
      .limit(limit)

    if (error) return { error: error.message }

    const data: OngoingTrip[] = (trips ?? []).map((trip: any) => ({
      id: trip.id,
      route: trip.route,
      departure_date: trip.departure_date,
      expected_arrival: trip.expected_arrival,
      status: 'in_progress',
      driver_name: trip.driver?.profile?.full_name ?? 'Unassigned',
      vehicle_plate: trip.vehicle?.plate_number ?? null,
    }))

    return { data }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to fetch ongoing trips' }
  }
}
