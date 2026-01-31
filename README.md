# FTA Action Sports

**Forget the Algorithm.** Next.js app with Supabase auth, Athlete vs Brand accounts, and dynamic athlete sport logic (Stance / Foot Forward / Style by sport).

## Stack

- **Next.js** (App Router), **Tailwind**, **TypeScript**
- **Supabase** (Auth + PostgreSQL)

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - In **Authentication → URL Configuration**, set:
     - **Site URL**: `http://localhost:3000` (or your production URL)
     - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and production callback URL if needed)
   - In **SQL Editor**, run the migration:
     - Copy the contents of `supabase/migrations/20250130000000_profiles_and_athletes.sql` and execute it.

3. **Env**

   ```bash
   cp .env.example .env.local
   ```

   In `.env.local` set:

   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon/public key

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up → confirm email (if enabled) → you’ll land on **Choose account** (Athlete or Brand). Athletes then complete onboarding with **Sport** and the matching technical spec (Stance for board, Foot Forward for bike, Style for motor/other).

## Auth flow

1. **Sign up** (`/auth/sign-up`) → email confirmation (if enabled)
2. **Auth callback** (`/auth/callback`) → redirect to **Choose account**
3. **Choose account** (`/auth/choose-account`) → **Athlete** or **Brand**
4. **Athlete** → **Onboarding** (`/auth/onboarding`): pick sport (Skate, Surf, Snow, BMX, MTB, Other), then:
   - **Board (Skate/Surf/Snow):** Stance = Regular | Goofy
   - **Bike (BMX/MTB):** Foot Forward = Left | Right
   - **Motor/Other:** Style = Park | Street | Dirt | Flatland
5. **Dashboard** (`/dashboard`) for signed-in users

## Database: dynamic sport logic

- **Board sports:** `sport_category = 'board'`, use `stance` (regular/goofy).
- **Bike sports:** `sport_category = 'bike'`, use `foot_forward` (left/right).
- **Motor/Other:** `sport_category = 'motor_other'`, use `style` (park/street/dirt/flatland).

The migration enforces this with a `profiles_athlete_sport_check` constraint. Brand profiles have no sport fields.

## Design (from .cursorrules)

- **Colors:** Black `#000000`, Paper `#F4F4F4`, Safety Orange `#FF5F1F`
- **UI:** Sharp edges (no rounded corners), 2px+ borders, heavy sans-serif
