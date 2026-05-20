
REVOKE EXECUTE ON FUNCTION public.approve_pending_word(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_pending_word(uuid) TO authenticated;
