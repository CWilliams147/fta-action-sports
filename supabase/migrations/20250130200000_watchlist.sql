-- Brand Watchlist: brands save athletes to a watchlist for scouting

CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS watchlist_brand_id_idx ON public.watchlist(brand_id);
CREATE INDEX IF NOT EXISTS watchlist_athlete_id_idx ON public.watchlist(athlete_id);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Anyone can read watchlist (for "on watchlist" badge on cards)
CREATE POLICY "Watchlist is viewable by everyone"
  ON public.watchlist FOR SELECT
  USING (true);

-- Brands can only insert their own watchlist entry
CREATE POLICY "Brands can insert own watchlist"
  ON public.watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = brand_id);

-- Brands can only delete their own watchlist entry
CREATE POLICY "Brands can delete own watchlist"
  ON public.watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = brand_id);
