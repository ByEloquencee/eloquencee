
CREATE TABLE public.pending_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  part_of_speech text NOT NULL DEFAULT '',
  definition text NOT NULL DEFAULT '',
  simplified_definition text NOT NULL DEFAULT '',
  example_sentence text NOT NULL DEFAULT '',
  etymology text,
  dictionary_source text NOT NULL DEFAULT 'manual',
  source_url text,
  stylistic_tags text[] NOT NULL DEFAULT '{}'::text[],
  difficulty_level text NOT NULL DEFAULT 'advanced',
  category text NOT NULL DEFAULT 'ogólne',
  ai_confidence_score numeric,
  created_by_ai boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  batch_id uuid,
  batch_prompt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  approved_at timestamptz,
  approved_by uuid,
  published_word_id uuid
);

CREATE INDEX idx_pending_words_status_created ON public.pending_words (verification_status, created_at DESC);
CREATE INDEX idx_pending_words_batch ON public.pending_words (batch_id);

ALTER TABLE public.pending_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view pending words"
  ON public.pending_words FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can insert pending words"
  ON public.pending_words FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update pending words"
  ON public.pending_words FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can delete pending words"
  ON public.pending_words FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE OR REPLACE FUNCTION public.approve_pending_word(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pw public.pending_words%ROWTYPE;
  new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO pw FROM public.pending_words WHERE id = _id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending word not found';
  END IF;
  IF pw.verification_status = 'approved' THEN
    RAISE EXCEPTION 'Already approved';
  END IF;

  INSERT INTO public.global_words (
    word, part_of_speech, definition, example, etymology, category, difficulty, created_by
  ) VALUES (
    pw.word, pw.part_of_speech, pw.definition, pw.example_sentence,
    pw.etymology, pw.category, pw.difficulty_level, auth.uid()
  )
  RETURNING id INTO new_id;

  UPDATE public.pending_words
    SET verification_status = 'approved',
        approved_at = now(),
        approved_by = auth.uid(),
        published_word_id = new_id
    WHERE id = _id;

  RETURN new_id;
END;
$$;
