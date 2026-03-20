import type { TripStatus } from '@/lib/types/database'

export interface ShipmentTripOption {
  id: string
  route: string
  departure_date: string
  status: TripStatus
  vehicle_capacity: number | null
  vehicle_plate_number: string | null
  current_load_weight: number
}
