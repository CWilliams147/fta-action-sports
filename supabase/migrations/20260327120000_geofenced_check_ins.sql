-- Geofenced check-ins: status, expiry, spot radius; realtime for live occupancy.

-- Spot geofence radius (meters), default 50m
ALTER TABLE public.spots
  ADD COLUMN IF NOT EXISTS radius_meters INTEGER NOT NULL DEFAULT 50
  CHECK (radius_meters > 0 AND radius_meters <= 50000);

-- Session columns on check_ins
ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.check_ins
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill: every row gets an expiry window from created_at; historical rows are completed
UPDATE public.check_ins
SET
  expires_at = created_at + interval '4 hours'
WHERE expires_at IS NULL;

UPDATE public.check_ins
SET status = CASE
  WHEN created_at + interval '4 hours' > now() THEN 'active'
  ELSE 'completed'
END
WHERE status IS NULL;

ALTER TABLE public.check_ins
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.check_ins
  ALTER COLUMN expires_at SET NOT NULL;

ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_status_check CHECK (status IN ('active', 'completed'));

-- At most one active session per user per spot
CREATE UNIQUE INDEX IF NOT EXISTS check_ins_one_active_per_user_spot
  ON public.check_ins (user_id, spot_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS check_ins_active_spot_expires_idx
  ON public.check_ins (spot_id, status, expires_at)
  WHERE status = 'active';

-- Users can update their own rows (check-out)
CREATE POLICY "Users can update own check_ins"
  ON public.check_ins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for `check_ins` in Supabase Dashboard → Database → Publications
-- (or run: ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;)
