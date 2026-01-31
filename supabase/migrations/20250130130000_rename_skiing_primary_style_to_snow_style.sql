-- Rename skiing_primary_style to snow_style (used by both Skiing and Snowboarding)

ALTER TYPE skiing_primary_style_type RENAME TO snow_style_type;

ALTER TABLE public.profiles RENAME COLUMN skiing_primary_style TO snow_style;

-- Re-add constraint using new column name
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_athlete_sport_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND snow_style IS NULL AND discipline IS NULL AND skate_style IS NULL)
    OR
    (account_type = 'athlete' AND (
      (sport_category = 'board' AND (
        (stance IS NOT NULL OR snow_style IS NOT NULL OR skate_style IS NOT NULL) AND foot_forward IS NULL AND style IS NULL AND discipline IS NULL
      ))
      OR (sport_category = 'bike' AND foot_forward IS NOT NULL AND stance IS NULL AND style IS NULL AND snow_style IS NULL AND discipline IS NULL AND skate_style IS NULL)
      OR (sport_category = 'motor_other' AND discipline IS NOT NULL AND stance IS NULL AND foot_forward IS NULL AND snow_style IS NULL AND skate_style IS NULL)
      OR (sport_category IS NULL)
    ))
  );
