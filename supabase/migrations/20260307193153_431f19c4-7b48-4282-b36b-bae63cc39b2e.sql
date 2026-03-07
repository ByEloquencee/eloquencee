
-- Table for hiding built-in static words (moderator only)
CREATE TABLE public.hidden_static_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id text NOT NULL UNIQUE,
  hidden_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hidden_static_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hidden words" ON public.hidden_static_words
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Moderators can insert hidden words" ON public.hidden_static_words
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can delete hidden words" ON public.hidden_static_words
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'moderator'));

-- Table for overriding built-in static word fields (moderator only)
CREATE TABLE public.static_word_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id text NOT NULL UNIQUE,
  word text,
  part_of_speech text,
  definition text,
  example text,
  etymology text,
  category text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.static_word_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read overrides" ON public.static_word_overrides
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Moderators can insert overrides" ON public.static_word_overrides
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can update overrides" ON public.static_word_overrides
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can delete overrides" ON public.static_word_overrides
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'moderator'));
