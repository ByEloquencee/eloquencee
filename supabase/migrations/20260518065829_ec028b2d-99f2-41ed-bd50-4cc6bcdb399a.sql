
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai usage" ON public.ai_usage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(_user_id uuid, _limit integer DEFAULT 30)
RETURNS TABLE (allowed boolean, current_count integer, daily_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, date, count)
  VALUES (_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = ai_usage.count + 1, updated_at = now()
  RETURNING count INTO new_count;

  IF new_count > _limit THEN
    -- rollback the increment
    UPDATE public.ai_usage SET count = count - 1, updated_at = now()
      WHERE user_id = _user_id AND date = CURRENT_DATE;
    RETURN QUERY SELECT false, _limit, _limit;
  ELSE
    RETURN QUERY SELECT true, new_count, _limit;
  END IF;
END;
$$;
