-- Brand profile: banner, social links, scouting status

DO $$ BEGIN
  CREATE TYPE scouting_status_type AS ENUM ('actively_scouting', 'monitoring', 'roster_full');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS email_public TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS youtube TEXT,
  ADD COLUMN IF NOT EXISTS scouting_status scouting_status_type;

-- Storage bucket for brand banners (hero 1200x400)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brands', 'brands', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to own brand folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brands' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read for brands"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brands');

CREATE POLICY "Users can update own brand files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brands' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own brand files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brands' AND (storage.foldername(name))[1] = auth.uid()::text);
