-- Allow riders to select multiple styles: skate_styles, snow_styles, disciplines as arrays

-- Add new array columns (default empty array)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skate_styles skate_style_type[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS snow_styles snow_style_type[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disciplines discipline_type[] DEFAULT '{}';

-- Migrate existing single values to arrays (one element)
UPDATE public.profiles SET skate_styles = ARRAY[skate_style] WHERE skate_style IS NOT NULL;
UPDATE public.profiles SET snow_styles = ARRAY[snow_style] WHERE snow_style IS NOT NULL;
UPDATE public.profiles SET disciplines = ARRAY[discipline] WHERE discipline IS NOT NULL;

-- Drop old single-value columns
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS skate_style,
  DROP COLUMN IF EXISTS snow_style,
  DROP COLUMN IF EXISTS discipline;

-- Re-add constraint using array columns (at least one style when applicable)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_athlete_sport_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND snow_styles = '{}' AND disciplines = '{}' AND skate_styles = '{}')
    OR
    (account_type = 'athlete' AND (
      (sport_category = 'board' AND (
        (stance IS NOT NULL OR cardinality(snow_styles) > 0 OR cardinality(skate_styles) > 0) AND foot_forward IS NULL AND style IS NULL AND disciplines = '{}'
      ))
      OR (sport_category = 'bike' AND foot_forward IS NOT NULL AND stance IS NULL AND style IS NULL AND snow_styles = '{}' AND disciplines = '{}' AND skate_styles = '{}')
      OR (sport_category = 'motor_other' AND cardinality(disciplines) > 0 AND stance IS NULL AND foot_forward IS NULL AND snow_styles = '{}' AND skate_styles = '{}')
      OR (sport_category IS NULL)
    ))
  );
