
-- Create flashcard_sets table
CREATE TABLE public.flashcard_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own flashcard sets"
  ON public.flashcard_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcard sets"
  ON public.flashcard_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard sets"
  ON public.flashcard_sets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcard sets"
  ON public.flashcard_sets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add set_id to custom_words (nullable so existing words still work)
ALTER TABLE public.custom_words ADD COLUMN set_id uuid REFERENCES public.flashcard_sets(id) ON DELETE CASCADE;
