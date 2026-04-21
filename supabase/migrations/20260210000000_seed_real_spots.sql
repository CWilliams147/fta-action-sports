-- SEED DATA FOR REAL-WORLD SPOTS.
-- Upserts by (name, lat, lng) so re-running this migration does not create duplicates.

-- Allow upserts: unique on name + coordinates
CREATE UNIQUE INDEX IF NOT EXISTS spots_name_lat_lng_key
  ON public.spots (name, lat, lng);

-- Batch insert/update: add rows below. On conflict (name, lat, lng), update sport/type/description.
INSERT INTO public.spots (name, sport, type, lat, lng, description)
VALUES
  -- Example row (add more lines below; keep trailing comma on each line):
  ('The Berrics', 'Skateboard', 'park', 33.9308, -118.3696, 'Private skatepark in Los Angeles.')
ON CONFLICT (name, lat, lng)
  DO UPDATE SET
    sport       = EXCLUDED.sport,
    type        = EXCLUDED.type,
    description = EXCLUDED.description;
