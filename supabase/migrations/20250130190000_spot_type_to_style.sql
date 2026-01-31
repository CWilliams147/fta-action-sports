-- Spot types become sport-specific riding styles (TEXT instead of enum)

ALTER TABLE public.spots
  ALTER COLUMN type TYPE TEXT USING type::text;

ALTER TABLE public.spots
  ALTER COLUMN type SET DEFAULT 'street';

DROP TYPE IF EXISTS spot_type;
