-- FTA Action Sports: profiles + dynamic athlete stance/sport logic
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Account type: Athlete or Brand
CREATE TYPE account_type AS ENUM ('athlete', 'brand');

-- Sport category drives which technical spec field we show (Stance vs Foot Forward vs Style)
CREATE TYPE sport_category AS ENUM ('board', 'bike', 'motor_other');

-- Board sports (Skate, Surf, Snow): Stance = Regular | Goofy
CREATE TYPE stance_type AS ENUM ('regular', 'goofy');

-- Bike sports (BMX, MTB): Foot Forward = Left | Right
CREATE TYPE foot_forward_type AS ENUM ('left', 'right');

-- Motor/Other: Style = Park | Street | Dirt | Flatland
CREATE TYPE style_type AS ENUM ('park', 'street', 'dirt', 'flatland');

-- Optional: human-readable sport name (Skate, Surf, Snow, BMX, MTB, etc.)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type account_type NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Athlete-only: sport category determines which spec field is used
  sport_category sport_category,
  sport_name TEXT,

  -- Board sports: Stance (Regular / Goofy)
  stance stance_type,

  -- Bike sports: Foot Forward (Left / Right)
  foot_forward foot_forward_type,

  -- Motor/Other: Style (Park, Street, Dirt, Flatland)
  style style_type,

  -- Constraints: only athletes get sport fields; stance/foot_forward/style match sport_category
  CONSTRAINT profiles_athlete_sport_check CHECK (
    (account_type = 'brand' AND sport_category IS NULL AND stance IS NULL AND foot_forward IS NULL AND style IS NULL)
    OR
    (account_type = 'athlete' AND (
      (sport_category = 'board' AND stance IS NOT NULL AND foot_forward IS NULL AND style IS NULL)
      OR (sport_category = 'bike' AND foot_forward IS NOT NULL AND stance IS NULL AND style IS NULL)
      OR (sport_category = 'motor_other' AND style IS NOT NULL AND stance IS NULL AND foot_forward IS NULL)
      OR (sport_category IS NULL)
    ))
  )
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Optional: create profile on signup (call from app or trigger)
-- Uncomment to auto-create profile row on auth.users insert:
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, account_type)
  VALUES (NEW.id, 'athlete');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
-- We do NOT auto-create here so the app can set account_type (Athlete vs Brand) on first step.
