-- Daps: one row per user per clip (user gives daps to a clip once)

CREATE TABLE IF NOT EXISTS public.daps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, clip_id)
);

CREATE INDEX IF NOT EXISTS daps_clip_id_idx ON public.daps(clip_id);
CREATE INDEX IF NOT EXISTS daps_user_id_idx ON public.daps(user_id);

ALTER TABLE public.daps ENABLE ROW LEVEL SECURITY;

-- Anyone can read daps (for counts and "has user dapped" checks)
CREATE POLICY "Daps are viewable by everyone"
  ON public.daps FOR SELECT
  USING (true);

-- Authenticated users can insert their own dap (one per clip enforced by unique constraint)
CREATE POLICY "Users can insert own dap"
  ON public.daps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Athlete Daps (Reputation): one row per voter per athlete (voter can only dap an athlete once)

CREATE TABLE IF NOT EXISTS public.profile_daps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(voter_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS profile_daps_athlete_id_idx ON public.profile_daps(athlete_id);
CREATE INDEX IF NOT EXISTS profile_daps_voter_id_idx ON public.profile_daps(voter_id);

ALTER TABLE public.profile_daps ENABLE ROW LEVEL SECURITY;

-- Anyone can read profile_daps (for reputation count and "has user dapped" checks)
CREATE POLICY "Profile daps are viewable by everyone"
  ON public.profile_daps FOR SELECT
  USING (true);

-- Authenticated users can insert their own profile dap (one per athlete enforced by unique constraint)
CREATE POLICY "Users can insert own profile dap"
  ON public.profile_daps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = voter_id);
