
-- pack_word_overrides: kuratorska warstwa nad kategoriami
CREATE TABLE public.pack_word_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('include','exclude')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, word_id)
);
ALTER TABLE public.pack_word_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pack overrides" ON public.pack_word_overrides FOR SELECT USING (true);
CREATE POLICY "Moderators can insert pack overrides" ON public.pack_word_overrides FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can update pack overrides" ON public.pack_word_overrides FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can delete pack overrides" ON public.pack_word_overrides FOR DELETE TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE INDEX idx_pack_overrides_pack ON public.pack_word_overrides(pack_id);

-- pack_premium_words: słowa dla 5 paczek Premium
CREATE TABLE public.pack_premium_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id TEXT NOT NULL,
  word TEXT NOT NULL,
  part_of_speech TEXT NOT NULL DEFAULT '',
  definition TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  etymology TEXT,
  difficulty TEXT NOT NULL DEFAULT 'advanced',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pack_premium_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read premium pack words" ON public.pack_premium_words FOR SELECT USING (true);
CREATE POLICY "Moderators can insert premium pack words" ON public.pack_premium_words FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can update premium pack words" ON public.pack_premium_words FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can delete premium pack words" ON public.pack_premium_words FOR DELETE TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE INDEX idx_premium_words_pack ON public.pack_premium_words(pack_id);

-- pack_progress: postęp użytkownika
CREATE TABLE public.pack_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_id, word_id)
);
ALTER TABLE public.pack_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own pack progress" ON public.pack_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pack progress" ON public.pack_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own pack progress" ON public.pack_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_pack_progress_user_pack ON public.pack_progress(user_id, pack_id);
