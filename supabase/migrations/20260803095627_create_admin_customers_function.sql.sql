-- Create a view that safely exposes user data for admin use
-- The admin is identified by their email being admin@elanbeauty.com

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is the admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only allow the admin user (admin@elanbeauty.com) to call this
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@elanbeauty.com'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', '-') AS full_name,
    COALESCE(u.raw_user_meta_data->>'phone', '-') AS phone,
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute to authenticated users (the function itself checks admin access)
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;