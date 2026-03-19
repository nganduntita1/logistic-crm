# Requirements Document

## Introduction

This document specifies the requirements for a fullstack logistics CRM application designed for transportation agencies that move cargo between Johannesburg (South Africa) and Lubumbashi or Kinshasa (Democratic Republic of Congo). The system manages clients, shipments, trips, drivers, and vehicles while providing real-time tracking capabilities and role-based access for administrators, operators, and drivers.

## Glossary

- **System**: The logistics CRM web application
- **Admin**: A user with full system access and administrative privileges
- **Operator**: A user who manages shipments, clients, and trips
- **Driver**: A user who operates vehicles and delivers shipments
- **Client**: A customer who sends cargo through the transportation agency
- **Receiver**: The person who receives cargo at the destination
- **Shipment**: A cargo item being transported from sender to receiver
- **Trip**: A journey from origin to destination with assigned driver, vehicle, and shipments
- **Tracking_Number**: A unique identifier for each shipment
- **Vehicle**: A transportation unit used to carry shipments
- **Delivery_Proof**: Evidence of successful delivery including photo and signature
- **Driver_Location**: GPS coordinates of a driver at a specific timestamp
- **Authentication_Service**: Supabase Auth system for user authentication
- **Database**: Supabase PostgreSQL database
- **Storage_Service**: Supabase Storage for files and images
- **Map_Component**: Leaflet-based map interface for location visualization

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a user, I want to securely log in to the system with role-based access, so that I can access features appropriate to my role.

#### Acceptance Criteria

1. THE Authentication_Service SHALL authenticate users using Supabase Auth
2. WHEN a user successfully authenticates, THE System SHALL retrieve the user's role from the profiles table
3. WHEN authentication succeeds, THE System SHALL redirect the user to the dashboard
4. THE System SHALL restrict access to features based on user role (Admin, Operator, Driver)
5. WHEN an unauthenticated user attempts to access protected routes, THE System SHALL redirect to the login page
6. THE System SHALL maintain user session state across page navigation

### Requirement 2: Dashboard Analytics

**User Story:** As an Admin or Operator, I want to view key metrics on the dashboard, so that I can monitor business performance at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the count of shipments currently in transit
2. THE Dashboard SHALL display the count of shipments delivered
3. THE Dashboard SHALL display the count of active trips
4. THE Dashboard SHALL display total revenue summary
5. WHEN dashboard data changes, THE System SHALL update the displayed metrics within 5 seconds

### Requirement 3: Client Management

**User Story:** As an Admin or Operator, I want to manage client information, so that I can maintain accurate customer records.

#### Acceptance Criteria

1. THE System SHALL allow creation of new clients with name, phone, whatsapp, email, address, city, country, and notes
2. THE System SHALL allow editing of existing client information
3. THE System SHALL display a list of all clients with search and filter capabilities
4. WHEN viewing a client, THE System SHALL display the client's shipment history
5. THE System SHALL validate that phone and email fields contain properly formatted data
6. THE System SHALL prevent deletion of clients who have associated shipments

### Requirement 4: Shipment Creation and Management

**User Story:** As an Operator, I want to create and manage shipments, so that I can track cargo from origin to destination.

#### Acceptance Criteria

1. WHEN creating a shipment, THE System SHALL generate a unique Tracking_Number
2. THE System SHALL allow assignment of client_id and receiver_id to each shipment
3. THE System SHALL capture shipment details including description, quantity, weight, value, and price
4. THE System SHALL allow assignment of a shipment to a trip
5. THE System SHALL track shipment status (pending, in_transit, delivered, cancelled)
6. THE System SHALL track payment status (unpaid, partial, paid)
7. WHEN a shipment is created, THE System SHALL record the creation timestamp
8. THE System SHALL display a timeline view showing shipment status changes

### Requirement 5: Trip Management

**User Story:** As an Operator, I want to create and manage trips, so that I can organize shipment deliveries efficiently.

#### Acceptance Criteria

1. THE System SHALL allow creation of trips with route, departure_date, and expected_arrival
2. THE System SHALL allow assignment of a driver and vehicle to each trip
3. THE System SHALL allow attachment of multiple shipments to a trip
4. THE System SHALL track trip status (planned, in_progress, completed, cancelled)
5. WHEN a trip is assigned shipments, THE System SHALL update those shipments' trip_id
6. THE System SHALL prevent assignment of a driver to overlapping trips
7. THE System SHALL prevent assignment of a vehicle to overlapping trips

### Requirement 6: Driver Management

**User Story:** As an Admin, I want to manage driver information, so that I can maintain accurate driver records and assignments.

#### Acceptance Criteria

1. THE System SHALL allow creation of driver profiles with license_number and passport_number
2. THE System SHALL link each driver to a user_id from the profiles table
3. THE System SHALL allow assignment of a vehicle to a driver
4. THE System SHALL track driver status (active, inactive, on_leave)
5. WHEN viewing a driver, THE System SHALL display the driver's trip history
6. THE System SHALL validate that license_number and passport_number are unique

### Requirement 7: Vehicle Management

**User Story:** As an Admin, I want to manage vehicle information, so that I can track fleet capacity and maintenance schedules.

#### Acceptance Criteria

1. THE System SHALL allow creation of vehicles with plate_number, type, capacity, and insurance_expiry
2. THE System SHALL track vehicle status (available, in_use, maintenance, retired)
3. THE System SHALL validate that plate_number is unique
4. WHEN insurance_expiry is within 30 days, THE System SHALL display a warning notification
5. THE System SHALL allow editing of vehicle information
6. THE System SHALL prevent deletion of vehicles assigned to active trips

### Requirement 8: Driver Mobile Interface

**User Story:** As a Driver, I want a mobile-friendly interface to manage my deliveries, so that I can update shipment status while on the road.

#### Acceptance Criteria

1. THE System SHALL provide a mobile-responsive dashboard for drivers
2. THE Driver_Interface SHALL display trips assigned to the authenticated driver
3. THE Driver_Interface SHALL allow drivers to update shipment status
4. THE Driver_Interface SHALL allow drivers to upload delivery photos
5. THE Driver_Interface SHALL provide a location update button
6. THE System SHALL optimize the Driver_Interface for touch interactions and small screens

### Requirement 9: Driver Location Tracking

**User Story:** As a Driver, I want to share my location, so that the office can track my progress during deliveries.

#### Acceptance Criteria

1. WHEN a driver requests location update, THE System SHALL use the browser Geolocation API to obtain coordinates
2. THE System SHALL save latitude, longitude, and timestamp to the driver_locations table
3. WHEN geolocation permission is denied, THE System SHALL display an error message to the driver
4. THE System SHALL record the driver_id with each location update
5. THE System SHALL allow manual location updates at any time

### Requirement 10: Admin Map Visualization

**User Story:** As an Admin or Operator, I want to view driver locations on a map, so that I can monitor fleet distribution and progress.

#### Acceptance Criteria

1. THE Map_Component SHALL display driver locations using Leaflet
2. THE Map_Component SHALL show the last known location for each active driver
3. WHEN a driver location is clicked, THE Map_Component SHALL display driver name and last update timestamp
4. THE Map_Component SHALL center on the region between Johannesburg and DRC
5. THE Map_Component SHALL refresh location data every 60 seconds

### Requirement 11: Delivery Confirmation

**User Story:** As a Driver, I want to capture delivery proof, so that I can confirm successful delivery to receivers.

#### Acceptance Criteria

1. THE System SHALL allow drivers to upload a delivery photo for each shipment
2. THE System SHALL save uploaded photos to the Storage_Service
3. THE System SHALL create a delivery_proofs record with shipment_id, receiver_name, photo_url, and delivered_at timestamp
4. WHEN a delivery photo is uploaded, THE System SHALL update the shipment status to delivered
5. THE System SHALL validate that uploaded files are image formats (jpg, png, webp)
6. THE System SHALL compress images larger than 2MB before upload

### Requirement 12: Search and Filter System

**User Story:** As an Operator, I want to search for shipments and clients quickly, so that I can respond to customer inquiries efficiently.

#### Acceptance Criteria

1. THE System SHALL allow searching shipments by Tracking_Number
2. THE System SHALL allow searching clients by name or phone number
3. WHEN a search query is entered, THE System SHALL return results within 2 seconds
4. THE System SHALL support partial matching for name searches
5. THE System SHALL display search results in a table format with relevant columns
6. THE System SHALL highlight the matching search term in results

### Requirement 13: Database Schema Implementation

**User Story:** As a developer, I want a well-structured database schema, so that data integrity is maintained across the application.

#### Acceptance Criteria

1. THE Database SHALL implement tables for profiles, clients, receivers, vehicles, drivers, trips, shipments, driver_locations, and delivery_proofs
2. THE Database SHALL enforce foreign key constraints between related tables
3. THE Database SHALL use UUID for primary keys
4. THE Database SHALL use timestamp fields for created_at and updated_at tracking
5. THE Database SHALL implement appropriate indexes on frequently queried fields (tracking_number, phone, email)
6. THE Database SHALL enforce NOT NULL constraints on required fields

### Requirement 14: User Interface Layout

**User Story:** As a user, I want a consistent and intuitive interface, so that I can navigate the system efficiently.

#### Acceptance Criteria

1. THE System SHALL use a sidebar navigation layout for desktop views
2. THE System SHALL display data in tables with sorting and filtering capabilities
3. THE System SHALL use ShadCN UI components for consistent styling
4. THE System SHALL implement TailwindCSS for responsive design
5. WHEN screen width is below 768px, THE System SHALL collapse the sidebar to a hamburger menu
6. THE System SHALL provide visual feedback for loading states and user actions

### Requirement 15: Data Validation and Error Handling

**User Story:** As a user, I want clear error messages when I enter invalid data, so that I can correct mistakes quickly.

#### Acceptance Criteria

1. WHEN invalid data is submitted, THE System SHALL display field-specific error messages
2. THE System SHALL validate required fields before form submission
3. THE System SHALL validate email format using standard email regex patterns
4. THE System SHALL validate phone numbers contain only digits and allowed characters
5. WHEN a server error occurs, THE System SHALL display a user-friendly error message
6. THE System SHALL prevent form submission while validation errors exist

### Requirement 16: File Upload and Storage

**User Story:** As a Driver, I want to upload delivery photos securely, so that proof of delivery is stored reliably.

#### Acceptance Criteria

1. THE System SHALL upload files to the Storage_Service using secure connections
2. THE System SHALL generate unique filenames to prevent collisions
3. THE System SHALL store file URLs in the delivery_proofs table
4. WHEN upload fails, THE System SHALL retry up to 3 times before displaying an error
5. THE System SHALL validate file size does not exceed 10MB
6. THE System SHALL organize uploaded files in folders by shipment_id

### Requirement 17: Revenue and Payment Tracking

**User Story:** As an Admin, I want to track shipment payments and revenue, so that I can monitor financial performance.

#### Acceptance Criteria

1. THE System SHALL record price for each shipment
2. THE System SHALL track payment_status (unpaid, partial, paid) for each shipment
3. THE Dashboard SHALL calculate total revenue from paid shipments
4. THE System SHALL allow filtering shipments by payment_status
5. THE System SHALL display payment status with visual indicators (colors or icons)

### Requirement 18: Receiver Management

**User Story:** As an Operator, I want to manage receiver information, so that shipments are delivered to the correct recipients.

#### Acceptance Criteria

1. THE System SHALL allow creation of receivers with name, phone, address, city, and country
2. THE System SHALL allow selection of existing receivers when creating shipments
3. THE System SHALL allow creation of new receivers during shipment creation
4. THE System SHALL validate that receiver phone numbers are properly formatted
5. THE System SHALL display receiver information on shipment detail views

### Requirement 19: Trip Status Workflow

**User Story:** As an Operator, I want to track trip progress through status changes, so that I can monitor delivery timelines.

#### Acceptance Criteria

1. WHEN a trip is created, THE System SHALL set status to planned
2. WHEN a trip departure_date is reached, THE System SHALL allow status change to in_progress
3. WHEN all shipments in a trip are delivered, THE System SHALL allow status change to completed
4. THE System SHALL allow manual status change to cancelled with confirmation
5. WHEN trip status changes to in_progress, THE System SHALL update associated shipment statuses to in_transit

### Requirement 20: Shipment Timeline Visualization

**User Story:** As a Client or Operator, I want to view shipment history, so that I can track progress and identify delays.

#### Acceptance Criteria

1. THE System SHALL display a timeline of status changes for each shipment
2. THE Timeline SHALL show timestamps for each status change
3. THE Timeline SHALL display the user who made each status change
4. THE Timeline SHALL show creation, assignment to trip, in transit, and delivery events
5. THE Timeline SHALL display events in chronological order with visual indicators

