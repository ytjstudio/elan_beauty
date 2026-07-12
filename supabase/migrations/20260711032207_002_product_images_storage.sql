/*
# Create product images storage bucket

1. Storage
- Create a public bucket `product-images` for storing product and category images uploaded by the admin.
- Set the bucket to public so storefront images load without auth.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
DROP POLICY IF EXISTS "anon_read_product_images" ON storage.objects;
CREATE POLICY "anon_read_product_images" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "auth_upload_product_images" ON storage.objects;
CREATE POLICY "auth_upload_product_images" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update/delete their uploads
DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "auth_update_product_images" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
