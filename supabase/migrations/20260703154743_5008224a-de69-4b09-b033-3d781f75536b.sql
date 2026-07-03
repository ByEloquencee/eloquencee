REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_premium(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_pending_word(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_ai_usage(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_pending_word(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;