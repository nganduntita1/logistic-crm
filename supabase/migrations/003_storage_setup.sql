-- Storage bucket configuration for delivery photos
-- This migration sets up the storage bucket and Row Level Security policies

-- Note: The bucket itself must be created through the Supabase Dashboard UI
-- Go to Storage > Create a new bucket > Name: "delivery-photos" > Public bucket: Yes

-- ============================================================================
-- STORAGE POLICIES FOR DELIVERY-PHOTOS BUCKET
-- ============================================================================

-- Policy: Allow authenticated users to upload delivery photos
CREATE POLICY "Authenticated users can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-photos');

-- Policy: Allow public read access to delivery photos
CREATE POLICY "Public can view delivery photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'delivery-photos');

-- Policy: Allow authenticated users to delete their own uploads (optional)
-- This allows users to delete files they uploaded
CREATE POLICY "Authenticated users can delete delivery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'delivery-photos');

-- Policy: Allow authenticated users to update their uploads (optional)
CREATE POLICY "Authenticated users can update delivery photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'delivery-photos');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- File Organization:
-- Files will be organized by shipment ID in the following structure:
-- delivery-photos/
--   ├── {shipment_id_1}/
--   │   ├── 1234567890-photo1.jpg
--   │   └── 1234567891-photo2.jpg
--   ├── {shipment_id_2}/
--   │   └── 1234567892-photo1.jpg
--   └── ...
--
-- Allowed File Types:
-- - image/jpeg (.jpg, .jpeg)
-- - image/png (.png)
-- - image/webp (.webp)
--
-- File Size Limits:
-- - Maximum: 10MB per file
-- - Files larger than 2MB will be automatically compressed by the application
--
-- Compression Settings:
-- - Maximum dimensions: 1920x1920 (maintains aspect ratio)
-- - JPEG quality: 80%
-- - Format: JPEG (converted from PNG/WebP if needed)
