# Seed Data Guide

This document explains how to populate your demo database with realistic dummy data.

## What's Included in the Seed Data

The seed script (`supabase/seed.sql`) populates:

- **5 Users**: 1 admin, 1 operator, 3 drivers
- **5 Clients**: FastFood Express, Tech Solutions, Fashion Retail, Pharma Distribution, Furniture Plus
- **8 Receivers**: Various warehouse and distribution centers
- **6 Vehicles**: Box trucks, vans, semi trucks, and flatbeds
- **3 Drivers**: Assigned to vehicles and active
- **Driver Locations**: Real-time GPS coordinates for active drivers
- **4 Trips**: Mix of planned, in-progress, and completed routes
- **8 Shipments**: Various statuses (pending, in_transit, delivered) and payment statuses
- **Delivery Proofs**: Photo evidence for completed deliveries
- **Status History**: Complete audit trail of shipment status changes

## How to Run the Seed Script

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents from `supabase/seed.sql`
5. Paste into the editor
6. Click **Run** button
7. Wait for completion (should be instant)

### Option 2: Supabase CLI

```bash
# From project root
supabase db push  # First ensure migrations are applied

# Then run the seed
psql "connection_string" < supabase/seed.sql
```

### Option 3: Node.js Script (If preferred)

You can create a `scripts/seed.ts` file and run it with:
```bash
npx ts-node scripts/seed.ts
```

## Demo Credentials

Use these accounts to test different user roles:

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| admin@demo.com | (set in Supabase Auth) | Admin | Full system access |
| operator@demo.com | (set in Supabase Auth) | Operator | Manage operations |
| driver1@demo.com | (set in Supabase Auth) | Driver | John Smith |
| driver2@demo.com | (set in Supabase Auth) | Driver | Mike Johnson |
| driver3@demo.com | (set in Supabase Auth) | Driver | Sarah Williams |

**Note**: You need to manually create these auth accounts in Supabase Auth > Users. The seed script only creates the profile records.

## Create Auth Users Manually

1. Go to **Authentication > Users** in Supabase dashboard
2. Click **Add User**
3. Enter email from table above
4. Set a temporary password or auto-generate
5. Click **Create User**
6. User will be linked to the corresponding profile record automatically

OR use Supabase CLI:
```bash
supabase auth admin create-user \
  --email admin@demo.com \
  --password DemoPassword123!
```

## Data Highlights for Demo

### Dashboard Metrics
- **3 Active Trips** (mix of in-progress and planned)
- **3 Delivered Shipments** with proof
- **2 In Transit Shipments** 
- **3 Pending Shipments** awaiting dispatch
- **$35,000 in total shipment value**
- **~$20,000 paid revenue**

### Map View
- 3 active drivers with live GPS coordinates
- Positioned around NYC area (realistic coordinates)

### Sample Flows to Demo

1. **Create Shipment** → Use existing clients and receivers
2. **Assign to Trip** → Use planned trips
3. **Track in Real-Time** → Show driver locations on map
4. **Complete Delivery** → Mark as delivered with photo
5. **Payment Tracking** → Show mixed payment statuses
6. **View Analytics** → Dashboard shows revenue, trip stats, delivery metrics

## Reset/Clear Data

If you need to start fresh:

```sql
TRUNCATE TABLE shipment_status_history CASCADE;
TRUNCATE TABLE delivery_proofs CASCADE;
TRUNCATE TABLE driver_locations CASCADE;
TRUNCATE TABLE shipments CASCADE;
TRUNCATE TABLE trips CASCADE;
TRUNCATE TABLE drivers CASCADE;
TRUNCATE TABLE vehicles CASCADE;
TRUNCATE TABLE receivers CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE profiles CASCADE;
```

Then run the seed script again.

## Tips for Demo

- Keep the seed data loaded for demo purposes
- You can create additional clients/shipments manually through the UI to show flexibility
- Use different statuses to demonstrate the full workflow
- Show driver tracking by opening the Map view
- Walk through a complete shipment: pending → in_transit → delivered
