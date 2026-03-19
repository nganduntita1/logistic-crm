# Implementation Plan: Logistics CRM Application

## Overview

This implementation plan breaks down the logistics CRM application into discrete, incremental coding tasks. The application is built with Next.js 14 (App Router), TypeScript, Supabase, TailwindCSS, and ShadCN UI. Each task builds on previous work, with property-based tests integrated throughout to validate correctness early.

## Tasks

- [x] 1. Project initialization and core setup
  - Initialize Next.js 14 project with TypeScript and App Router
  - Install and configure TailwindCSS
  - Install and configure ShadCN UI components
  - Set up project structure (app/, components/, lib/ directories)
  - Configure environment variables for Supabase
  - _Requirements: 14.3, 14.4_

- [x] 2. Supabase configuration and database schema
  - [x] 2.1 Create Supabase project and configure connection
    - Set up Supabase client utilities (client.ts, server.ts, middleware.ts)
    - Configure Supabase Auth helpers for Next.js
    - _Requirements: 1.1, 13.1_
  
  - [x] 2.2 Implement database schema with all tables
    - Create profiles table with role field
    - Create clients, receivers, vehicles, drivers tables
    - Create trips, shipments tables with foreign keys
    - Create driver_locations, delivery_proofs tables
    - Create shipment_status_history table
    - Add all indexes for frequently queried fields
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 2.3 Create database function for latest driver locations
    - Implement get_latest_driver_locations() PostgreSQL function
    - _Requirements: 10.2_
  
  - [x] 2.4 Configure Supabase Storage bucket
    - Create delivery-photos bucket with public read access
    - Set up Row Level Security policies for storage
    - _Requirements: 16.1, 16.2_
  
  - [ ]* 2.5 Write property tests for database constraints
    - **Property 32: Foreign Key Constraint Enforcement**
    - **Validates: Requirements 13.2**
    - **Property 33: Timestamp Tracking**
    - **Validates: Requirements 13.4**
    - **Property 34: NOT NULL Constraint Enforcement**
    - **Validates: Requirements 13.6**

- [x] 3. Checkpoint - Verify database setup
  - Ensure all tables created successfully, ask the user if questions arise.

- [x] 4. TypeScript types and validation schemas
  - [x] 4.1 Generate TypeScript types from Supabase schema
    - Create database.ts with all table types and enums
    - Define UserRole, ShipmentStatus, PaymentStatus, TripStatus, VehicleStatus, DriverStatus types
    - _Requirements: 4.5, 4.6, 5.4, 6.4, 7.2, 17.2_
  
  - [x] 4.2 Create Zod validation schemas
    - Implement clientSchema with email and phone validation
    - Implement shipmentSchema with positive number constraints
    - Implement tripSchema with date validation
    - Implement driverSchema and vehicleSchema
    - Implement receiverSchema
    - _Requirements: 3.5, 15.1, 15.2, 15.3, 15.4_
  
  - [ ]* 4.3 Write property tests for validation
    - **Property 7: Input Validation**
    - **Validates: Requirements 3.5, 15.1, 15.2, 15.3, 15.4, 15.6**
    - **Property 12: Status Enumeration Validity**
    - **Validates: Requirements 4.5, 4.6, 5.4, 6.4, 7.2, 17.2**

- [ ] 5. Authentication and authorization
  - [x] 5.1 Implement authentication middleware
    - Create middleware.ts with session checking
    - Implement role-based route protection
    - Add redirects for unauthenticated users
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 5.2 Create login page
    - Build login form with email/password fields
    - Implement Supabase Auth sign-in
    - Add error handling for invalid credentials
    - _Requirements: 1.1, 1.3_
  
  - [x] 5.3 Create authentication server actions
    - Implement signIn, signOut, getSession actions
    - Add profile fetching with role
    - _Requirements: 1.2, 1.6_
  
  - [ ]* 5.4 Write property tests for authentication
    - **Property 1: Role-Based Authorization**
    - **Validates: Requirements 1.4, 1.5**
    - **Property 2: Session Persistence**
    - **Validates: Requirements 1.6**

- [x] 6. Layout and navigation components
  - [x] 6.1 Create main dashboard layout
    - Implement sidebar navigation with role-based menu items
    - Create responsive layout with mobile hamburger menu
    - Add header component
    - _Requirements: 14.1, 14.5_
  
  - [x] 6.2 Create auth layout (no sidebar)
    - Simple centered layout for login page
    - _Requirements: 14.1_
  
  - [x] 6.3 Install and configure ShadCN UI base components
    - Add Button, Input, Card, Table, Dialog, Select components
    - Add Sheet component for mobile menu
    - Add Toast component for notifications
    - _Requirements: 14.3_

- [x] 7. Shared UI components
  - [x] 7.1 Create reusable DataTable component
    - Implement sorting functionality
    - Implement filtering functionality
    - Add pagination
    - _Requirements: 14.2_
  
  - [x] 7.2 Create SearchInput component
    - Implement debounced search input
    - _Requirements: 12.3_
  
  - [x] 7.3 Create status badge components
    - StatusBadge for shipments
    - TripStatusBadge for trips
    - Add color coding for different statuses
    - _Requirements: 17.5_
  
  - [ ]* 7.4 Write property test for table functionality
    - **Property 35: Table Sorting and Filtering**
    - **Validates: Requirements 14.2**

- [x] 8. Client management module
  - [x] 8.1 Create client server actions
    - Implement createClient action with validation
    - Implement updateClient action
    - Implement deleteClient action with referential integrity check
    - Implement searchClients action
    - _Requirements: 3.1, 3.2, 3.6, 12.2_
  
  - [x] 8.2 Create client list page
    - Display all clients in DataTable
    - Add search functionality
    - Add "New Client" button
    - _Requirements: 3.3_
  
  - [x] 8.3 Create client form component
    - Build form with all client fields
    - Add validation with Zod schema
    - Handle form submission with server action
    - _Requirements: 3.1, 3.5_
  
  - [x] 8.4 Create client detail page
    - Display client information
    - Show shipment history for the client
    - Add edit button
    - _Requirements: 3.4_
  
  - [x] 8.5 Create new client page
    - Render ClientForm for creation
    - _Requirements: 3.1_
  
  - [ ]* 8.6 Write property tests for client operations
    - **Property 4: Client CRUD Operations**
    - **Validates: Requirements 3.1, 3.2**
    - **Property 5: Client Search Accuracy**
    - **Validates: Requirements 3.3, 12.2, 12.4**
    - **Property 6: Client Shipment History**
    - **Validates: Requirements 3.4**
    - **Property 8: Referential Integrity Protection**
    - **Validates: Requirements 3.6, 7.6**

- [x] 9. Receiver management module
  - [x] 9.1 Create receiver server actions
    - Implement createReceiver action
    - Implement getReceivers action for selection
    - _Requirements: 18.1, 18.2_
  
  - [x] 9.2 Create receiver form component
    - Build form with name, phone, address, city, country fields
    - Add validation
    - _Requirements: 18.1, 18.4_
  
  - [ ]* 9.3 Write property tests for receiver operations
    - **Property 41: Receiver Creation Completeness**
    - **Validates: Requirements 18.1**
    - **Property 42: Receiver Selection and Display**
    - **Validates: Requirements 18.2, 18.5**

- [x] 10. Vehicle management module
  - [x] 10.1 Create vehicle server actions
    - Implement createVehicle action
    - Implement updateVehicle action
    - Implement deleteVehicle action with active trip check
    - Implement getVehicles action
    - _Requirements: 7.1, 7.5, 7.6_
  
  - [x] 10.2 Create vehicle list page
    - Display vehicles in DataTable
    - Show insurance expiry warnings
    - Add "New Vehicle" button
    - _Requirements: 7.4_
  
  - [x] 10.3 Create vehicle form component
    - Build form with plate_number, type, capacity, insurance_expiry
    - Add validation
    - _Requirements: 7.1, 7.3_
  
  - [x] 10.4 Create vehicle detail page
    - Display vehicle information
    - Add edit functionality
    - _Requirements: 7.5_
  
  - [x] 10.5 Create insurance warning component
    - Check if insurance_expiry is within 30 days
    - Display warning badge
    - _Requirements: 7.4_
  
  - [ ]* 10.6 Write property tests for vehicle operations
    - **Property 21: Uniqueness Constraints (vehicles)**
    - **Validates: Requirements 7.3**
    - **Property 22: Vehicle Creation Completeness**
    - **Validates: Requirements 7.1**
    - **Property 23: Insurance Expiry Warning Logic**
    - **Validates: Requirements 7.4**
    - **Property 24: Vehicle Update Persistence**
    - **Validates: Requirements 7.5**

- [x] 11. Driver management module
  - [x] 11.1 Create driver server actions
    - Implement createDriver action with uniqueness checks
    - Implement updateDriver action
    - Implement getDrivers action
    - Implement assignVehicleToDriver action
    - _Requirements: 6.1, 6.3, 6.6_
  
  - [x] 11.2 Create driver list page (Admin only)
    - Display drivers in DataTable
    - Show assigned vehicles
    - Add "New Driver" button
    - _Requirements: 6.5_
  
  - [x] 11.3 Create driver form component
    - Build form with user_id, license_number, passport_number, vehicle_id
    - Add validation for unique constraints
    - _Requirements: 6.1, 6.6_
  
  - [x] 11.4 Create driver detail page
    - Display driver information
    - Show trip history
    - _Requirements: 6.5_
  
  - [ ]* 11.5 Write property tests for driver operations
    - **Property 18: Driver Profile Completeness**
    - **Validates: Requirements 6.1, 6.2**
    - **Property 19: Driver Vehicle Assignment**
    - **Validates: Requirements 6.3**
    - **Property 20: Driver Trip History**
    - **Validates: Requirements 6.5**
    - **Property 21: Uniqueness Constraints (drivers)**
    - **Validates: Requirements 6.6**

- [ ] 12. Checkpoint - Verify all CRUD modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Shipment management module
  - [x] 13.1 Create shipment server actions
    - Implement createShipment action with tracking number generation
    - Implement updateShipment action
    - Implement updateShipmentStatus action with history tracking
    - Implement searchShipments action (by tracking number)
    - Implement getShipmentTimeline action
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7, 4.8, 12.1_
  
  - [x] 13.2 Create shipment list page
    - Display shipments in DataTable
    - Add search by tracking number
    - Add filters for status and payment_status
    - Add "New Shipment" button
    - _Requirements: 12.1, 17.4_
  
  - [x] 13.3 Create shipment form component
    - Build form with all shipment fields
    - Add client and receiver selection dropdowns
    - Add option to create new receiver inline
    - Add trip assignment dropdown
    - Add validation
    - _Requirements: 4.2, 4.3, 4.4, 18.3_
  
  - [x] 13.4 Create shipment detail page
    - Display shipment information
    - Show timeline of status changes
    - Display delivery proof if exists
    - _Requirements: 4.8, 20.4_
  
  - [x] 13.5 Create shipment timeline component
    - Display status history in chronological order
    - Show timestamp, status, user, and notes for each event
    - Add visual indicators
    - _Requirements: 20.1, 20.2, 20.3, 20.5_
  
  - [ ]* 13.6 Write property tests for shipment operations
    - **Property 9: Tracking Number Uniqueness**
    - **Validates: Requirements 4.1**
    - **Property 10: Shipment Creation Completeness**
    - **Validates: Requirements 4.3, 4.7, 17.1**
    - **Property 11: Shipment-Trip Assignment**
    - **Validates: Requirements 4.4, 5.5**
    - **Property 13: Shipment Timeline Completeness**
    - **Validates: Requirements 4.8, 20.1, 20.2, 20.3, 20.5**
    - **Property 31: Shipment Search by Tracking Number**
    - **Validates: Requirements 12.1**
    - **Property 40: Payment Status Filtering**
    - **Validates: Requirements 17.4**

- [x] 14. Trip management module
  - [x] 14.1 Create trip server actions
    - Implement createTrip action with overlap validation
    - Implement updateTrip action
    - Implement updateTripStatus action with cascading shipment updates
    - Implement assignShipmentsToTrip action
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 19.1, 19.2, 19.3, 19.5_
  
  - [x] 14.2 Create trip list page
    - Display trips in DataTable
    - Show driver and vehicle assignments
    - Add filters for status
    - Add "New Trip" button
    - _Requirements: 5.4_
  
  - [x] 14.3 Create trip form component
    - Build form with route, departure_date, expected_arrival
    - Add driver and vehicle selection dropdowns
    - Add date validation (expected_arrival >= departure_date)
    - Check for overlapping assignments
    - _Requirements: 5.1, 5.2, 5.6, 5.7_
  
  - [x] 14.4 Create trip detail page
    - Display trip information
    - Show assigned shipments
    - Add status update controls
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 14.5 Write property tests for trip operations
    - **Property 14: Trip Creation Validity**
    - **Validates: Requirements 5.1, 19.1**
    - **Property 15: Trip Assignment**
    - **Validates: Requirements 5.2**
    - **Property 16: Trip Shipment Collection**
    - **Validates: Requirements 5.3**
    - **Property 17: No Overlapping Resource Assignments**
    - **Validates: Requirements 5.6, 5.7**
    - **Property 43: Trip Status Transition Rules**
    - **Validates: Requirements 19.2, 19.3**
    - **Property 44: Cascading Status Update on Trip Start**
    - **Validates: Requirements 19.5**

- [x] 15. Dashboard with analytics
  - [x] 15.1 Create dashboard server actions
    - Implement getDashboardMetrics action
    - Calculate shipments in transit count
    - Calculate shipments delivered count
    - Calculate active trips count
    - Calculate total revenue from paid shipments
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 17.3_
  
  - [x] 15.2 Create dashboard page
    - Display metric cards for all key metrics
    - Add auto-refresh every 5 seconds
    - _Requirements: 2.5_
  
  - [x] 15.3 Create MetricCard component
    - Display metric title, value, and icon
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 15.4 Write property test for dashboard
    - **Property 3: Dashboard Metrics Accuracy**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 17.3**

- [x] 16. Driver location tracking
  - [x] 16.1 Create location server actions
    - Implement updateDriverLocation action with coordinate validation
    - Implement getLatestDriverLocations action
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [x] 16.2 Create LocationButton component
    - Use browser Geolocation API
    - Handle permission denied errors
    - Show loading state during location fetch
    - Call updateDriverLocation on success
    - _Requirements: 9.1, 9.3, 9.5_
  
  - [ ]* 16.3 Write property tests for location tracking
    - **Property 27: Location Data Persistence**
    - **Validates: Requirements 9.2, 9.4**
    - **Property 28: Latest Location Per Driver**
    - **Validates: Requirements 10.2**

- [x] 17. Map visualization with Leaflet
  - [x] 17.1 Install and configure Leaflet
    - Install react-leaflet and leaflet packages
    - Add Leaflet CSS to layout
    - _Requirements: 10.1_
  
  - [x] 17.2 Create DriverMap component
    - Initialize Leaflet map centered on Johannesburg-DRC region
    - Add OpenStreetMap tile layer
    - Render markers for each driver location
    - Add popups with driver name and last update time
    - Implement auto-refresh every 60 seconds
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 17.3 Create map page
    - Fetch latest driver locations
    - Render DriverMap component
    - _Requirements: 10.1_

- [x] 18. Delivery proof and photo upload
  - [x] 18.1 Create delivery server actions
    - Implement uploadDeliveryPhoto action
    - Add file type validation (jpg, png, webp)
    - Add file size validation (10MB max)
    - Implement image compression for files > 2MB using Sharp
    - Upload to Supabase Storage with retry logic (3 attempts)
    - Create delivery_proofs record
    - Update shipment status to delivered
    - Record status change in history
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 16.4, 16.5_
  
  - [x] 18.2 Create PhotoUpload component
    - File input with image preview
    - Show upload progress
    - Display error messages
    - _Requirements: 8.4, 11.1_
  
  - [x] 18.3 Create DeliveryForm component
    - Combine PhotoUpload with receiver name input
    - Handle form submission
    - _Requirements: 11.1, 11.3_
  
  - [ ]* 18.4 Write property tests for delivery operations
    - **Property 29: Delivery Photo Upload and Status Update**
    - **Validates: Requirements 8.4, 11.1, 11.3, 11.4, 11.5**
    - **Property 30: Image Compression**
    - **Validates: Requirements 11.6**
    - **Property 36: Filename Uniqueness**
    - **Validates: Requirements 16.2**
    - **Property 37: File URL Storage**
    - **Validates: Requirements 16.3**
    - **Property 38: File Size Validation**
    - **Validates: Requirements 16.5**
    - **Property 39: File Organization by Shipment**
    - **Validates: Requirements 16.6**

- [x] 19. Driver mobile portal
  - [x] 19.1 Create driver portal page
    - Display trips assigned to authenticated driver
    - Show pending deliveries (shipments in_transit)
    - Add LocationButton for location updates
    - Optimize for mobile with large touch targets
    - _Requirements: 8.1, 8.2, 8.6_
  
  - [x] 19.2 Create delivery confirmation page
    - Show shipment details
    - Render DeliveryForm for photo upload
    - _Requirements: 8.3, 8.4_
  
  - [x] 19.3 Create TripCard component for mobile
    - Large, touch-friendly card design
    - Display trip route and dates
    - _Requirements: 8.6_
  
  - [x] 19.4 Create ShipmentDeliveryCard component
    - Display shipment info
    - Link to delivery confirmation page
    - _Requirements: 8.3_
  
  - [ ]* 19.5 Write property tests for driver portal
    - **Property 25: Driver Trip Display Authorization**
    - **Validates: Requirements 8.2**
    - **Property 26: Driver Shipment Status Update**
    - **Validates: Requirements 8.3**

- [x] 20. Final integration and polish
  - [x] 20.1 Add loading states to all pages
    - Implement LoadingSpinner component
    - Add Suspense boundaries
    - _Requirements: 14.6_
  
  - [x] 20.2 Add error handling and user feedback
    - Implement ErrorMessage component
    - Add toast notifications for all actions
    - Add user-friendly error messages
    - _Requirements: 15.5_
  
  - [x] 20.3 Implement search result highlighting
    - Highlight matching terms in search results
    - _Requirements: 12.6_
  
  - [x] 20.4 Add visual feedback for user actions
    - Loading states on buttons
    - Success/error toasts
    - _Requirements: 14.6_

- [-] 21. Final checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- The implementation uses TypeScript throughout for type safety
- All 44 correctness properties from the design document are covered
- Checkpoints ensure incremental validation at key milestones
