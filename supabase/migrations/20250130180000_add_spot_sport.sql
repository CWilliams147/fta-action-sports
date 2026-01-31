-- Add sport column to spots (if migration 20250130170000 was run before sport was added)

ALTER TABLE public.spots
  ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'Skateboard';
