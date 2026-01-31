-- Skateboard: Style (Street, Vert, Park, Freestyle, Downhill)

DO $$ BEGIN
  CREATE TYPE skate_style_type AS ENUM ('street', 'vert', 'park', 'freestyle', 'downhill');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skate_style skate_style_type;

-- Allow board athletes to have skate_style (Skateboard)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_athlete_sport_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL AND skate_style IS NULL)
    OR
    (account_type = 'athlete' AND (
      (sport_category = 'board' AND (
        (stance IS NOT NULL OR skiing_primary_style IS NOT NULL OR skate_style IS NOT NULL) AND foot_forward IS NULL AND style IS NULL AND discipline IS NULL
      ))
      OR (sport_category = 'bike' AND foot_forward IS NOT NULL AND stance IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL AND skate_style IS NULL)
      OR (sport_category = 'motor_other' AND discipline IS NOT NULL AND stance IS NULL AND foot_forward IS NULL AND skiing_primary_style IS NULL AND skate_style IS NULL)
      OR (sport_category IS NULL)
    ))
  );
