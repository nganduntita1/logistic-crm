# Supabase Setup Guide for Logistics CRM

This guide will walk you through setting up Supabase for the Logistics CRM application.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Node.js and npm installed
- This project cloned and dependencies installed

## Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `logistics-crm` (or your preferred name)
   - **Database Password**: Choose a strong password and save it securely
   - **Region**: Select the region closest to your users (e.g., `us-east-1` for USA)
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get Your API Credentials

1. Once your project is ready, go to **Settings** (gear icon in sidebar) > **API**
2. You'll see three important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
   - **service_role key**: Another long string starting with `eyJ...` (keep this secret!)
3. Keep this page open - you'll need these values in the next step

### Step 3: Configure Environment Variables

1. In your project root directory, create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values with your actual credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Save the file

### Step 4: Run Database Migrations

#### Migration 1: Initial Schema

1. In your Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy the entire contents
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this is correct!

#### Migration 2: Driver Locations Function

1. Click **"New query"** again
2. Open `supabase/migrations/002_driver_locations_function.sql`
3. Copy and paste the contents
4. Click **"Run"**
5. You should see "Success. No rows returned"

#### Migration 3: Storage Setup

First, create the storage bucket:

1. Click **Storage** in the sidebar
2. Click **"Create a new bucket"**
3. Enter the following:
   - **Name**: `delivery-photos`
   - **Public bucket**: Toggle this **ON** (important!)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: Leave empty (we'll validate in the app)
4. Click **"Create bucket"**

Then, set up the storage policies:

1. Go back to **SQL Editor**
2. Click **"New query"**
3. Open `supabase/migrations/003_storage_setup.sql`
4. Copy and paste the contents
5. Click **"Run"**

### Step 5: Verify the Setup

Let's verify everything is set up correctly:

1. Go to **Table Editor** in the sidebar
2. You should see all these tables:
   - ✅ profiles
   - ✅ clients
   - ✅ receivers
   - ✅ vehicles
   - ✅ drivers
   - ✅ trips
   - ✅ shipments
   - ✅ driver_locations
   - ✅ delivery_proofs
   - ✅ shipment_status_history

3. Go to **Storage** and verify:
   - ✅ `delivery-photos` bucket exists
   - ✅ It's marked as "Public"

4. Go to **Database** > **Functions** and verify:
   - ✅ `get_latest_driver_locations` function exists

### Step 6: Create Your First Admin User

Now let's create an admin user so you can log in:

1. Go to **Authentication** > **Users** in the sidebar
2. Click **"Add user"** > **"Create new user"**
3. Enter:
   - **Email**: Your email address (e.g., `admin@example.com`)
   - **Password**: Choose a strong password
   - **Auto Confirm User**: Toggle this **ON**
4. Click **"Create user"**
5. After the user is created, you'll see it in the list. **Copy the User ID** (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

6. Now, add this user to the profiles table:
   - Go to **SQL Editor**
   - Click **"New query"**
   - Paste this SQL (replace the values with your actual data):
     ```sql
     INSERT INTO profiles (id, email, full_name, role)
     VALUES (
       'paste-user-id-here',
       'admin@example.com',
       'Admin User',
       'admin'
     );
     ```
   - Click **"Run"**

### Step 7: Test the Connection

1. In your terminal, navigate to your project directory
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:3000`
4. You should see the application (it might redirect to a login page)

## Troubleshooting

### "Invalid API key" Error
- Double-check your `.env.local` file
- Make sure there are no extra spaces or quotes around the values
- Restart your development server after changing `.env.local`

### "relation does not exist" Error
- Make sure you ran all three migrations in order
- Check the SQL Editor for any error messages
- Try running the migrations again

### Can't Log In
- Make sure you created a profile record for your user
- Verify the user ID in the profiles table matches the auth.users ID
- Check that the role is set to 'admin'

### Storage Upload Fails
- Verify the `delivery-photos` bucket is marked as "Public"
- Check that the storage policies were created successfully
- Look for errors in the browser console

### Need to Start Over?
If something went wrong and you want to start fresh:

1. Go to **SQL Editor**
2. Run this query to drop all tables:
   ```sql
   DROP TABLE IF EXISTS shipment_status_history CASCADE;
   DROP TABLE IF EXISTS delivery_proofs CASCADE;
   DROP TABLE IF EXISTS driver_locations CASCADE;
   DROP TABLE IF EXISTS shipments CASCADE;
   DROP TABLE IF EXISTS trips CASCADE;
   DROP TABLE IF EXISTS drivers CASCADE;
   DROP TABLE IF EXISTS vehicles CASCADE;
   DROP TABLE IF EXISTS receivers CASCADE;
   DROP TABLE IF EXISTS clients CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   DROP FUNCTION IF EXISTS get_latest_driver_locations();
   DROP FUNCTION IF EXISTS update_updated_at_column();
   ```
3. Then run all migrations again from Step 4

## Next Steps

Now that Supabase is set up, you can:

1. ✅ Log in with your admin user
2. ✅ Start building out the application features
3. ✅ Create additional users (operators and drivers)
4. ✅ Test the CRUD operations for clients, vehicles, etc.

## Creating Additional Users

### Creating an Operator User

1. Go to **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Enter email and password, enable "Auto Confirm User"
4. Copy the User ID
5. In SQL Editor, run:
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('user-id-here', 'operator@example.com', 'Operator Name', 'operator');
   ```

### Creating a Driver User

1. Create the user in Authentication (same as above)
2. Add to profiles table with role 'driver':
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('user-id-here', 'driver@example.com', 'Driver Name', 'driver');
   ```
3. Then create a driver record:
   ```sql
   INSERT INTO drivers (user_id, license_number, passport_number, status)
   VALUES ('user-id-here', 'DL123456', 'PP789012', 'active');
   ```

## Security Notes

- **Never commit `.env.local` to version control** - it's already in `.gitignore`
- **Keep your service_role key secret** - it has admin access to your database
- **The anon key is safe to expose** - it's used in the browser and has limited permissions
- **Row Level Security (RLS)** will be configured in later tasks to restrict data access

## Support

If you encounter issues:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the error messages in the Supabase dashboard
3. Check the browser console for client-side errors
4. Verify all environment variables are set correctly

Happy coding! 🚀
