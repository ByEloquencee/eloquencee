-- Pack base: full word base for each pack, separate from per-level assignments
CREATE TABLE public.pack_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (pack_id, word_id)
);

ALTER TABLE public.pack_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pack words"
ON public.pack_words FOR SELECT
USING (true);

CREATE POLICY "Moderators can insert pack words"
ON public.pack_words FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update pack words"
ON public.pack_words FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can delete pack words"
ON public.pack_words FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE INDEX idx_pack_words_pack ON public.pack_words(pack_id, position);