-- Creative profile columns and vouches table only (no constraint using 'creative' yet)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipment_list TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS day_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS youtube_portfolio TEXT,
  ADD COLUMN IF NOT EXISTS vimeo_portfolio TEXT,
  ADD COLUMN IF NOT EXISTS behance_portfolio TEXT;

CREATE TABLE IF NOT EXISTS public.creative_vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(voter_id, creative_id)
);

CREATE INDEX IF NOT EXISTS creative_vouches_creative_id_idx ON public.creative_vouches(creative_id);
CREATE INDEX IF NOT EXISTS creative_vouches_voter_id_idx ON public.creative_vouches(voter_id);

ALTER TABLE public.creative_vouches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creative vouches are viewable by everyone"
  ON public.creative_vouches FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own creative vouch"
  ON public.creative_vouches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can delete own creative vouch"
  ON public.creative_vouches FOR DELETE TO authenticated
  USING (auth.uid() = voter_id);
