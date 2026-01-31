-- Spot Map: spots table with sport + type (Park, DIY, Street, Other)

CREATE TYPE public.spot_type AS ENUM ('Park', 'DIY', 'Street', 'Other');

CREATE TABLE IF NOT EXISTS public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'Skateboard',
  type spot_type NOT NULL DEFAULT 'Street',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spots_lat_lng_idx ON public.spots(lat, lng);

ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

-- Anyone can read spots (public map)
CREATE POLICY "Spots are viewable by everyone"
  ON public.spots FOR SELECT
  USING (true);

-- Authenticated users can insert spots (Add Spot for MVP)
CREATE POLICY "Authenticated users can insert spots"
  ON public.spots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Check-ins: user_id, spot_id, created_at (filter for latest per user in app)

CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS check_ins_spot_id_idx ON public.check_ins(spot_id);
CREATE INDEX IF NOT EXISTS check_ins_user_id_idx ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS check_ins_created_at_idx ON public.check_ins(created_at DESC);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Users can only INSERT if authenticated (one active check-in = we filter for latest in app)
CREATE POLICY "Authenticated users can insert check_ins"
  ON public.check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read check_ins (for Active Now / Who's here)
CREATE POLICY "Check_ins are viewable by everyone"
  ON public.check_ins FOR SELECT
  USING (true);
