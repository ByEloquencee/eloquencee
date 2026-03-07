
CREATE TABLE public.word_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  definition text NOT NULL DEFAULT '',
  example text NOT NULL DEFAULT '',
  part_of_speech text NOT NULL DEFAULT '',
  etymology text,
  category text NOT NULL DEFAULT 'ogólne',
  suggested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.word_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert suggestions" ON public.word_suggestions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Users can view their own suggestions" ON public.word_suggestions
  FOR SELECT TO authenticated USING (auth.uid() = suggested_by OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can update suggestions" ON public.word_suggestions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can delete suggestions" ON public.word_suggestions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'moderator'));
