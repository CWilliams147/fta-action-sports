-- Clip Catalog: clips table linked to profiles

CREATE TABLE IF NOT EXISTS public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  trick_name TEXT,
  location TEXT,
  spot_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clips_profile_id_idx ON public.clips(profile_id);
CREATE INDEX IF NOT EXISTS clips_created_at_idx ON public.clips(created_at DESC);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- Anyone can read clips (public catalog)
CREATE POLICY "Clips are viewable by everyone"
  ON public.clips FOR SELECT
  USING (true);

-- Only the profile owner can insert/update/delete their clips
CREATE POLICY "Users can insert own clips"
  ON public.clips FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own clips"
  ON public.clips FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own clips"
  ON public.clips FOR DELETE
  USING (auth.uid() = profile_id);

-- Storage bucket "clips" for video uploads (public so video_url can be used for playback)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clips', 'clips', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload clips to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'clips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read for clips"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'clips');

CREATE POLICY "Users can update own clip files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'clips' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own clip files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'clips' AND (storage.foldername(name))[1] = auth.uid()::text);
