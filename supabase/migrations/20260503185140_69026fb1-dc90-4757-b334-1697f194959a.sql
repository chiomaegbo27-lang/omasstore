
-- Revoke anon execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;

-- Keep authenticated access for has_role (needed for RLS)
-- handle_new_user is trigger-only, revoke from authenticated too
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
