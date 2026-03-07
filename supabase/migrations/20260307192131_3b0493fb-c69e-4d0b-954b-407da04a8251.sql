-- Create role enum
CREATE TYPE public.app_role AS ENUM ('moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Global words table (readable by all, writable by moderators)
CREATE TABLE public.global_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  part_of_speech text NOT NULL DEFAULT '',
  definition text NOT NULL,
  example text NOT NULL DEFAULT '',
  etymology text,
  category text NOT NULL DEFAULT 'ogólne',
  difficulty text NOT NULL DEFAULT 'advanced',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.global_words ENABLE ROW LEVEL SECURITY;

-- Everyone can read global words
CREATE POLICY "Anyone can read global words"
  ON public.global_words FOR SELECT
  USING (true);

-- Only moderators can insert
CREATE POLICY "Moderators can insert global words"
  ON public.global_words FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'moderator'));

-- Only moderators can update
CREATE POLICY "Moderators can update global words"
  ON public.global_words FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));

-- Only moderators can delete
CREATE POLICY "Moderators can delete global words"
  ON public.global_words FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderator'));