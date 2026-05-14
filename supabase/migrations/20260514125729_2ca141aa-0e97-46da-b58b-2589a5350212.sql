
CREATE TABLE public.sponsored_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_name TEXT NOT NULL DEFAULT '',
  word TEXT NOT NULL,
  part_of_speech TEXT NOT NULL DEFAULT '',
  definition TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  etymology TEXT,
  link TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sponsored words"
ON public.sponsored_words FOR SELECT
USING (true);

CREATE POLICY "Moderators can insert sponsored words"
ON public.sponsored_words FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update sponsored words"
ON public.sponsored_words FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can delete sponsored words"
ON public.sponsored_words FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

INSERT INTO public.sponsored_words (sponsor_name, word, part_of_speech, definition, example, etymology, link, active)
VALUES (
  'Eloquencee Premium',
  'Eloquencee',
  'aplikacja',
  'Aplikacja do nauki nowych słów każdego dnia — rozwijaj swój język i elokwencję dzięki starannie dobranym hasłom z filozofii, literatury i wielu innych dziedzin.',
  'Dzięki Eloquencee codziennie poznaję jedno nowe, wartościowe słowo.',
  'od łac. eloquentia — "wymowność, krasomówstwo"',
  'https://eloquencee.pl',
  true
);
