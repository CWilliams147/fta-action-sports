-- Snowboarding: allow Primary Style in addition to Stance (same options as Skiing)
-- Board athletes can now have both stance and skiing_primary_style (e.g. Snowboard).

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_athlete_sport_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL)
    OR
    (account_type = 'athlete' AND (
      (sport_category = 'board' AND (
        (stance IS NOT NULL OR skiing_primary_style IS NOT NULL) AND foot_forward IS NULL AND style IS NULL AND discipline IS NULL
      ))
      OR (sport_category = 'bike' AND foot_forward IS NOT NULL AND stance IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL)
      OR (sport_category = 'motor_other' AND discipline IS NOT NULL AND stance IS NULL AND foot_forward IS NULL AND skiing_primary_style IS NULL)
      OR (sport_category IS NULL)
    ))
  );
