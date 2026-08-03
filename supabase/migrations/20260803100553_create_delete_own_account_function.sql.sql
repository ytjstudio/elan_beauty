-- Allow users to delete their own account
-- Supabase doesn't expose auth.admin.deleteUser() to the client,
-- so we need a SECURITY DEFINER function that deletes the caller's account.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent the admin from deleting their account this way
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = caller_id AND email = 'admin@elanbeauty.com'
  ) THEN
    RAISE EXCEPTION 'Admin account cannot be deleted this way';
  END IF;

  -- Delete the user's auth account (cascades to related data via FKs)
  DELETE FROM auth.users WHERE id = caller_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;