
-- Tabela słów przypisanych do konkretnego poziomu w paczce
CREATE TABLE public.pack_level_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  word_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, level, word_id)
);

CREATE INDEX idx_pack_level_words_lookup ON public.pack_level_words (pack_id, level);

ALTER TABLE public.pack_level_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pack level words"
  ON public.pack_level_words FOR SELECT
  USING (true);

CREATE POLICY "Moderators can insert pack level words"
  ON public.pack_level_words FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update pack level words"
  ON public.pack_level_words FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can delete pack level words"
  ON public.pack_level_words FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));
