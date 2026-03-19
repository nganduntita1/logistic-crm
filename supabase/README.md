# Supabase Database Setup

This directory contains SQL migration files for the Logistics CRM application.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - Name: logistics-crm (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
5. Wait for the project to be created (this may take a few minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### 3. Configure Environment Variables

1. In your project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 4. Run the Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

This will create all the necessary tables, indexes, constraints, and triggers.

### 5. Verify the Setup

After running the migration, you should see the following tables in your database:
- `profiles`
- `clients`
- `receivers`
- `vehicles`
- `drivers`
- `trips`
- `shipments`
- `driver_locations`
- `delivery_proofs`
- `shipment_status_history`

You can verify this by going to **Table Editor** in your Supabase dashboard.

## Additional Migrations

After running the initial schema migration, run these additional migrations in order:

### Migration 002: Driver Locations Function

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `migrations/002_driver_locations_function.sql`
3. Paste and run it

This creates a PostgreSQL function to efficiently retrieve the latest location for each active driver.

### Migration 003: Storage Setup

1. First, create the storage bucket:
   - Go to **Storage** in your Supabase dashboard
   - Click **Create a new bucket**
   - Name: `delivery-photos`
   - **Public bucket**: Yes (enable this)
   - Click **Create bucket**

2. Then, set up the storage policies:
   - Go to **SQL Editor**
   - Copy the contents of `migrations/003_storage_setup.sql`
   - Paste and run it

This configures Row Level Security policies for the delivery photos bucket.

## Next Steps

After completing all migrations:

1. Create your first admin user (see below)
2. Start the development server and test the application

## Creating Your First Admin User

To create your first admin user:

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click **Add User** > **Create new user**
3. Enter an email and password
4. After the user is created, note their User ID (UUID)
5. Go to **SQL Editor** and run:
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('user-uuid-here', 'admin@example.com', 'Admin User', 'admin');
   ```

Now you can log in with this user and access all admin features.

## Troubleshooting

### Migration Fails
- Make sure you copied the entire SQL file
- Check for any syntax errors in the SQL editor
- Ensure you're running the migration on a fresh database (or drop existing tables first)

### Can't Connect to Supabase
- Verify your environment variables are correct
- Make sure `.env.local` is in your project root
- Restart your Next.js development server after changing environment variables

### Authentication Issues
- Ensure the profiles table has a matching record for each auth.users entry
- Check that the user's role is set correctly in the profiles table
