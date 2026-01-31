-- FTA Action Sports: Athlete profile fields + username, verified, Skiing primary style, Moto discipline
-- Run after 20250130000000_profiles_and_athletes.sql

-- Skiing: Primary Style (Park/Pipe, Big Mountain, Backcountry)
DO $$ BEGIN
  CREATE TYPE skiing_primary_style_type AS ENUM ('park_pipe', 'big_mountain', 'backcountry');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Moto: Discipline (Freestyle, Racing, Enduro)
DO $$ BEGIN
  CREATE TYPE discipline_type AS ENUM ('freestyle', 'racing', 'enduro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS home_town TEXT,
  ADD COLUMN IF NOT EXISTS skiing_primary_style skiing_primary_style_type,
  ADD COLUMN IF NOT EXISTS discipline discipline_type,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- Drop old constraint so we can add updated one (allows Skiing + primary_style, Moto + discipline)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_athlete_sport_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL)
    OR
    (account_type = 'athlete' AND (
      (sport_category = 'board' AND (
        (stance IS NOT NULL AND foot_forward IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL)
        OR (skiing_primary_style IS NOT NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL AND discipline IS NULL)
      ))
      OR (sport_category = 'bike' AND foot_forward IS NOT NULL AND stance IS NULL AND style IS NULL AND skiing_primary_style IS NULL AND discipline IS NULL)
      OR (sport_category = 'motor_other' AND discipline IS NOT NULL AND stance IS NULL AND foot_forward IS NULL AND skiing_primary_style IS NULL)
      OR (sport_category IS NULL)
    ))
  );
