# Supabase Migration Guide - Dashboard Method

This guide will walk you through running your database migrations using the Supabase Dashboard.

## Prerequisites

- A Supabase project created at https://supabase.com/dashboard
- Your project URL and anon key configured in `.env.local`

## Step-by-Step Instructions

### Step 1: Access Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project from the list

### Step 2: Open SQL Editor

1. In the left sidebar, click on **"SQL Editor"**
2. Click the **"New query"** button (green button in the top right)

### Step 3: Run Migration 001 - Initial Schema

1. Open the file `supabase/migrations/001_initial_schema.sql` in your code editor
2. **Copy the entire contents** of the file (Cmd+A / Ctrl+A, then Cmd+C / Ctrl+C)
3. **Paste** into the Supabase SQL Editor
4. Click the **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
5. Wait for the success message at the bottom of the screen
6. You should see: "Success. No rows returned"

**What this creates:**
- 11 tables: profiles, clients, receivers, vehicles, drivers, trips, shipments, driver_locations, delivery_proofs, shipment_status_history
- All indexes for performance
- All foreign key constraints
- Triggers for automatic timestamp updates

### Step 4: Run Migration 002 - Driver Locations Function

1. Click **"New query"** again (or clear the current editor)
2. Open the file `supabase/migrations/002_driver_locations_function.sql`
3. **Copy the entire contents**
4. **Paste** into the SQL Editor
5. Click **"Run"**
6. Wait for success message

**What this creates:**
- `get_latest_driver_locations()` function for the map visualization

### Step 5: Run Migration 003 - Storage Setup

1. Click **"New query"** again
2. Open the file `supabase/migrations/003_storage_setup.sql`
3. **Copy the entire contents**
4. **Paste** into the SQL Editor
5. Click **"Run"**
6. Wait for success message

**What this creates:**
- Row Level Security (RLS) policies for the storage bucket

### Step 6: Create Storage Bucket (CRITICAL - Manual Step)

⚠️ **Important:** The storage bucket must be created manually through the UI.

1. In the left sidebar, click on **"Storage"**
2. Click the **"Create a new bucket"** button
3. Fill in the form:
   - **Name:** `delivery-photos` (exactly this name, no spaces)
   - **Public bucket:** Toggle to **Yes** ✓ (this allows public read access)
   - **File size limit:** Leave default or set to 10MB
   - **Allowed MIME types:** Leave empty (we'll validate in code)
4. Click **"Create bucket"**

### Step 7: Verify Everything Worked

#### Check Tables:
1. Click on **"Table Editor"** in the left sidebar
2. You should see all 11 tables:
   - clients
   - delivery_proofs
   - driver_locations
   - drivers
   - profiles
   - receivers
   - shipment_status_history
   - shipments
   - trips
   - vehicles

#### Check Function:
1. Click on **"Database"** in the left sidebar
2. Click on **"Functions"** tab
3. You should see: `get_latest_driver_locations`

#### Check Storage:
1. Click on **"Storage"** in the left sidebar
2. You should see the bucket: `delivery-photos`
3. Click on it to verify it's set to "Public"

#### Run Verification Query:
1. Go back to **"SQL Editor"**
2. Click **"New query"**
3. Paste this verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_latest_driver_locations';
```

4. Click **"Run"**
5. You should see 11 table names and the function name in the results

## Troubleshooting

### Error: "relation already exists"
- This means the table was already created
- You can skip this migration or drop the table first
- To drop: `DROP TABLE table_name CASCADE;` (be careful!)

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check that you have the correct project selected

### Error: "function already exists"
- The function was already created
- You can replace it by running: `DROP FUNCTION get_latest_driver_locations();` first

### Storage bucket not appearing
- Refresh the page
- Make sure you clicked "Create bucket" and not just "Cancel"
- Check the Storage section again

## Next Steps

Once all migrations are complete and verified:
1. Return to the task checkpoint
2. Confirm that all database objects are created
3. You're ready to proceed with Task 4: TypeScript types and validation schemas

## Need Help?

If you encounter any errors:
1. Copy the exact error message
2. Note which migration file caused the error
3. Share the error with your development team or in the project chat
