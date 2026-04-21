-- Membership tier, ghost mode, and spot sponsors

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_tier') THEN
    CREATE TYPE membership_tier AS ENUM ('free', 'pro', 'brand');
  END IF;
END$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_tier membership_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS ghost_mode BOOLEAN NOT NULL DEFAULT false;

-- Default brands to membership_tier 'brand'; athletes/creatives stay 'free' unless upgraded
UPDATE public.profiles SET membership_tier = 'brand' WHERE account_type = 'brand';

-- Spot sponsors: brands that sponsor or own a spot (logo = brand profile avatar)
CREATE TABLE IF NOT EXISTS public.spot_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(spot_id, brand_id)
);

CREATE INDEX IF NOT EXISTS spot_sponsors_spot_id_idx ON public.spot_sponsors(spot_id);
CREATE INDEX IF NOT EXISTS spot_sponsors_brand_id_idx ON public.spot_sponsors(brand_id);

ALTER TABLE public.spot_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spot sponsors are viewable by everyone"
  ON public.spot_sponsors FOR SELECT USING (true);

CREATE POLICY "Brands can manage own spot sponsor entries"
  ON public.spot_sponsors FOR ALL TO authenticated
  USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);
