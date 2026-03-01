
-- Folders table
CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'folder',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.folders FOR DELETE USING (auth.uid() = user_id);

-- Folder words junction table
CREATE TABLE public.folder_words (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  word_id text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(folder_id, word_id)
);

ALTER TABLE public.folder_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folder words" ON public.folder_words FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add words to their folders" ON public.folder_words FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove words from their folders" ON public.folder_words FOR DELETE USING (auth.uid() = user_id);
