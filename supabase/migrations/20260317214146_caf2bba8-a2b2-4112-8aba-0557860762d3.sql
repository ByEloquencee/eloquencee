
DROP POLICY "Anyone can read hidden words" ON public.hidden_static_words;
CREATE POLICY "Anyone can read hidden words" ON public.hidden_static_words FOR SELECT TO public USING (true);

DROP POLICY "Anyone can read overrides" ON public.static_word_overrides;
CREATE POLICY "Anyone can read overrides" ON public.static_word_overrides FOR SELECT TO public USING (true);
