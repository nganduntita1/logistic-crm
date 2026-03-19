// TypeScript types generated from Supabase database schema
// This file contains all table types and enums for the logistics CRM application

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'admin' | 'operator' | 'driver'

export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'retired'

export type DriverStatus = 'active' | 'inactive' | 'on_leave'

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone: string
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Receiver {
  id: string
  name: string
  phone: string
  address: string
  city: string
  country: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  plate_number: string
  type: string
  capacity: number
  insurance_expiry: string
  status: VehicleStatus
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  user_id: string
  license_number: string
  passport_number: string
  vehicle_id?: string | null
  status: DriverStatus
  created_at: string
  updated_at: string
  // Relations
  profile?: Profile
  vehicle?: Vehicle
}

export interface Trip {
  id: string
  route: string
  departure_date: string
  expected_arrival: string
  driver_id?: string | null
  vehicle_id?: string | null
  status: TripStatus
  created_at: string
  updated_at: string
  // Relations
  driver?: Driver
  vehicle?: Vehicle
  shipments?: Shipment[]
}

export interface Shipment {
  id: string
  tracking_number: string
  client_id: string
  receiver_id: string
  trip_id?: string | null
  description: string
  quantity: number
  weight: number
  value: number
  price: number
  status: ShipmentStatus
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  receiver?: Receiver
  trip?: Trip
  delivery_proof?: DeliveryProof
}

export interface DriverLocation {
  id: string
  driver_id: string
  latitude: number
  longitude: number
  timestamp: string
  created_at: string
}

export interface DeliveryProof {
  id: string
  shipment_id: string
  receiver_name: string
  photo_url: string
  delivered_at: string
  created_at: string
}

export interface ShipmentStatusHistory {
  id: string
  shipment_id: string
  status: ShipmentStatus
  changed_by: string
  notes?: string | null
  created_at: string
  // Relations
  profile?: Profile
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      receivers: {
        Row: Receiver
        Insert: Omit<Receiver, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Receiver, 'id' | 'created_at'>>
      }
      vehicles: {
        Row: Vehicle
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Vehicle, 'id' | 'created_at'>>
      }
      drivers: {
        Row: Driver
        Insert: Omit<Driver, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Driver, 'id' | 'created_at'>>
      }
      trips: {
        Row: Trip
        Insert: Omit<Trip, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Trip, 'id' | 'created_at'>>
      }
      shipments: {
        Row: Shipment
        Insert: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Shipment, 'id' | 'created_at'>>
      }
      driver_locations: {
        Row: DriverLocation
        Insert: Omit<DriverLocation, 'id' | 'created_at'>
        Update: Partial<Omit<DriverLocation, 'id' | 'created_at'>>
      }
      delivery_proofs: {
        Row: DeliveryProof
        Insert: Omit<DeliveryProof, 'id' | 'created_at'>
        Update: Partial<Omit<DeliveryProof, 'id' | 'created_at'>>
      }
      shipment_status_history: {
        Row: ShipmentStatusHistory
        Insert: Omit<ShipmentStatusHistory, 'id' | 'created_at'>
        Update: Partial<Omit<ShipmentStatusHistory, 'id' | 'created_at'>>
      }
    }
  }
}
