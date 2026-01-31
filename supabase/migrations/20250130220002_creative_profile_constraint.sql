-- Add CHECK constraint that allows account_type = 'creative' (enum value committed in 20250130219999)

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_athlete_sport_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND snow_styles = '{}' AND disciplines = '{}' AND skate_styles = '{}')
    OR
    (account_type = 'creative' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND snow_styles = '{}' AND disciplines = '{}' AND skate_styles = '{}')
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
