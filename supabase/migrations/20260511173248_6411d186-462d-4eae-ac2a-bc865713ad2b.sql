-- Tabela do przechowywania postępu użytkownika w paczkach słów (poziomy)
CREATE TABLE public.pack_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  pack_id text NOT NULL,
  highest_completed_level integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_id)
);

ALTER TABLE public.pack_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pack progress"
ON public.pack_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pack progress"
ON public.pack_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pack progress"
ON public.pack_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_pack_progress_user_pack ON public.pack_progress(user_id, pack_id);