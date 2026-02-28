
-- Create custom_words table for user-added words
CREATE TABLE public.custom_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  part_of_speech TEXT NOT NULL DEFAULT '',
  definition TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  etymology TEXT,
  category TEXT NOT NULL DEFAULT 'własne',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom words" ON public.custom_words FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom words" ON public.custom_words FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom words" ON public.custom_words FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom words" ON public.custom_words FOR DELETE USING (auth.uid() = user_id);

-- Create favorites table for logged-in users
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
