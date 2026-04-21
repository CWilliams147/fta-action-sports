# Spots Table – Data Reference for Pre-loading

Reference for research and batch-inserting real-world spot data. The `spots` table is used by the map; `check_ins` and stats are computed at read time.

---

## 1. Database schema (exact SQL)

The table is created and evolved in migrations. **Current effective definition:**

```sql
-- Effective schema after migrations 20250130170000, 20250130180000, 20250130190000

CREATE TABLE public.spots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  sport      TEXT NOT NULL DEFAULT 'Skateboard',
  type       TEXT NOT NULL DEFAULT 'street',
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX spots_lat_lng_idx ON public.spots(lat, lng);
```

**Columns:**

| Column       | Type             | Nullable | Default           | Notes                          |
|-------------|------------------|----------|-------------------|--------------------------------|
| `id`        | UUID             | NO       | `gen_random_uuid()` | Primary key                    |
| `name`      | TEXT             | NO       | —                 | Spot name                      |
| `sport`     | TEXT             | NO       | `'Skateboard'`    | One of the 7 sport names below |
| `type`      | TEXT             | NO       | `'street'`         | Sport-specific style (see below) |
| `lat`       | DOUBLE PRECISION | NO       | —                 | Latitude (WGS84)               |
| `lng`       | DOUBLE PRECISION | NO       | —                 | Longitude (WGS84)              |
| `description` | TEXT           | YES      | —                 | Optional description           |
| `created_at` | TIMESTAMPTZ     | NO       | `now()`           | Set by DB                      |

**Allowed `sport` values (must match app):**  
`Skateboard`, `Surf`, `Snowboard`, `Skiing`, `BMX`, `MTB`, `Moto`

**Allowed `type` values** are sport-specific; see `SPOT_STYLE_OPTIONS_BY_SPORT` in the app (e.g. Skateboard: `street`, `vert`, `park`, `freestyle`, `downhill`; Surf: `beach`, `point`, `reef`, …). Use lowercase and underscores (e.g. `park_pipe`, `big_mountain`).

---

## 2. Frontend type (Spot interface)

From `lib/types/database.ts`:

```ts
/** Spot: map location with name, sport, type (style), lat/lng, description */
export interface Spot {
  id: string;
  name: string;
  sport: string;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  created_at: string;
}
```

The map and spot cards use `Spot` and `SpotWithStats` (Spot plus `active_now`, `weekly_avg`, `heating_up`, `recent_check_ins`). Those extra fields are computed from `check_ins`, not stored on `spots`.

---

## 3. Example row (dummy spot)

**SQL (you can omit `id` and `created_at` to use defaults):**

```sql
INSERT INTO public.spots (name, sport, type, lat, lng, description)
VALUES (
  'The Berrics',
  'Skateboard',
  'park',
  33.9308,
  -118.3696,
  'Private skatepark in Los Angeles.'
);
```

**Same row as JSON (for scripts or API):**

```json
{
  "name": "The Berrics",
  "sport": "Skateboard",
  "type": "park",
  "lat": 33.9308,
  "lng": -118.3696,
  "description": "Private skatepark in Los Angeles."
}
```

**Example with explicit UUID and timestamp (optional):**

```sql
INSERT INTO public.spots (id, name, sport, type, lat, lng, description, created_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'The Berrics',
  'Skateboard',
  'park',
  33.9308,
  -118.3696,
  'Private skatepark in Los Angeles.',
  now()
);
```

---

## 4. Batch insert (seeding) – preferred method

**Use a new migration file** in `supabase/migrations/` so:

- Inserts are versioned and repeatable.
- They run with `supabase db push` or in the Supabase dashboard (SQL editor / run migrations).
- They match how the rest of the project manages schema and data.

**Steps:**

1. Add a new migration, e.g. `supabase/migrations/20250130240000_seed_spots.sql`.
2. Put your `INSERT` statements in that file (one or many rows).
3. Apply it:
   - **Local:** `npx supabase db push` (or your usual migration command).
   - **Supabase Dashboard:** Run the SQL in the SQL Editor, or run the migration if you use the dashboard for migrations.

**Example batch file:**

```sql
-- supabase/migrations/20250130240000_seed_spots.sql
-- Pre-loaded real-world spots (batch insert)

INSERT INTO public.spots (name, sport, type, lat, lng, description) VALUES
  ('The Berrics', 'Skateboard', 'park', 33.9308, -118.3696, 'Private skatepark in Los Angeles.'),
  ('Venice Beach Skatepark', 'Skateboard', 'park', 33.9850, -118.4695, 'Oceanfront skatepark.'),
  -- add more rows…
  ;
```

**Alternative:** If you prefer a one-off script (e.g. Node/TS) instead of a migration, you can use the Supabase client and insert in chunks; the **preferred** approach in this repo is still the migration `.sql` file above so all envs stay in sync.

---

## 5. Sport → type reference (for valid `type` values)

| Sport     | Valid `type` values (lowercase) |
|----------|----------------------------------|
| Skateboard | `street`, `vert`, `park`, `freestyle`, `downhill` |
| Surf     | `beach`, `point`, `reef`, `park`, `street` |
| Snowboard | `park_pipe`, `big_mountain`, `backcountry` |
| Skiing   | `park_pipe`, `big_mountain`, `backcountry` |
| BMX      | `park`, `street`, `dirt`, `flatland`, `diy` |
| MTB      | `park`, `trail`, `downhill`, `enduro`, `dirt` |
| Moto     | `freestyle`, `racing`, `enduro` |

Use these so the map and filters (e.g. “Add spot”, Athletes sport filter) behave correctly.

---

## 6. Seeding Snow / Ski spots

On the map, **Snow** is a single filter that shows spots where `sport` is either `Snowboard` or `Skiing`. You do **not** need two rows per resort/location.

**How to seed:**

1. **One row per place**  
   Use a single spot row per location (e.g. one row for "Mammoth Mountain", not one for Snowboard and one for Skiing).

2. **Pick one sport value**  
   Set `sport` to either `'Snowboard'` or `'Skiing'` based on how you want to tag the spot (e.g. resort that does both → pick one; backcountry zone → match primary use). Both values appear under the map's **Snow** filter.

3. **Use valid `type` for that sport**  
   For both Snowboard and Skiing the allowed `type` values are:
   - `park_pipe` — park / pipe
   - `big_mountain` — big mountain
   - `backcountry` — backcountry

4. **Same migration and upsert**  
   Add snow/ski rows to the same seed migration (`20260210000000_seed_real_spots.sql` or your batch file). The existing upsert on `(name, lat, lng)` works the same.

**Example snow/ski rows (for the batch INSERT):**

```sql
  ('Mammoth Mountain', 'Skiing', 'big_mountain', 37.6308, -119.0326, 'Major resort in the Eastern Sierra.'),
  ('Bear Mountain', 'Snowboard', 'park_pipe', 34.1767, -116.9370, 'SoCal park and pipe.'),
  ('Alta', 'Skiing', 'big_mountain', 40.5885, -111.6380, 'Ski-only resort in Little Cottonwood Canyon.'),
```

**JSON shape (if you're generating data for a script):**

```json
{ "name": "Mammoth Mountain", "sport": "Skiing", "type": "big_mountain", "lat": 37.6308, "lng": -119.0326, "description": "Major resort in the Eastern Sierra." }
```

---

## 7. Seeding MTB (mountain biking) spots

Use the same `spots` table and upsert migration. For mountain biking, `sport` must be exactly **`MTB`** and `type` must be one of the allowed values below.

**How to seed:**

1. **One row per location**  
   One spot = one place (trail system, bike park, zone). Do not create separate rows for the same place.

2. **Sport value**  
   Set `sport` to **`'MTB'`** (exact string, uppercase). No other value will show under the map’s MTB filter.

3. **Type (style) — must be one of these (lowercase):**  
   - `park` — bike park  
   - `trail` — trail riding  
   - `downhill` — downhill  
   - `enduro` — enduro  
   - `dirt` — dirt / jumps  

4. **Where to add rows**  
   Add MTB rows to the same seed migration file (`supabase/migrations/20260210000000_seed_real_spots.sql`). Use the existing `INSERT ... ON CONFLICT (name, lat, lng) DO UPDATE` so re-running does not create duplicates.

**Example MTB rows (for the batch INSERT):**

```sql
  ('DuPont State Forest', 'MTB', 'trail', 35.2134, -82.6021, 'Western NC trail system.'),
  ('Pisgah - Black Mountain', 'MTB', 'trail', 35.4521, -82.7234, 'Technical singletrack near Asheville.'),
  ('Beech Mountain Bike Park', 'MTB', 'park', 36.0876, -81.8823, 'Lift-served bike park.'),
  ('Windrock Bike Park', 'MTB', 'downhill', 36.0987, -84.3210, 'Downhill and enduro trails.'),
```

**JSON shape (for scripts/API):**

```json
{ "name": "DuPont State Forest", "sport": "MTB", "type": "trail", "lat": 35.2134, "lng": -82.6021, "description": "Western NC trail system." }
```

**Required columns:** `name` (TEXT, required), `sport` (`'MTB'`), `type` (one of park, trail, downhill, enduro, dirt), `lat` (number, WGS84), `lng` (number, WGS84). Optional: `description` (TEXT). Do not set `id` or `created_at` — the database fills those.

---

## 8. Seeding Moto spots

Use the same `spots` table and upsert migration. For moto (motorcycle), `sport` must be exactly **`Moto`** and `type` must be one of the allowed values below.

**How to seed:**

1. **One row per location**  
   One spot = one place (track, park, riding area, zone). Do not create separate rows for the same place.

2. **Sport value**  
   Set `sport` to **`'Moto'`** (exact string, capital M). No other value will show under the map’s Moto filter.

3. **Type (style) — must be one of these (lowercase):**  
   - `freestyle` — freestyle motocross, arenacross, demos  
   - `racing` — motocross tracks, supercross, race circuits  
   - `enduro` — enduro, trails, off-road riding areas  

4. **Where to add rows**  
   Add Moto rows to the same seed migration file (`supabase/migrations/20260210000000_seed_real_spots.sql`). Use the existing `INSERT ... ON CONFLICT (name, lat, lng) DO UPDATE` so re-running does not create duplicates.

**Example Moto rows (for the batch INSERT):**

```sql
  ('Lake Elsinore MX Park', 'Moto', 'racing', 33.6681, -117.3272, 'SoCal motocross track.'),
  ('Milestone Ranch', 'Moto', 'racing', 33.8923, -117.0456, 'MX and supercross facility.'),
  ('Glen Helen Raceway', 'Moto', 'racing', 34.1567, -117.4234, 'National-caliber motocross venue.'),
  ('Red Bud MX', 'Moto', 'racing', 41.8234, -86.4123, 'Pro Motocross National.'),
```

**JSON shape (for scripts/API):**

```json
{ "name": "Lake Elsinore MX Park", "sport": "Moto", "type": "racing", "lat": 33.6681, "lng": -117.3272, "description": "SoCal motocross track." }
```

**Required columns:** `name` (TEXT, required), `sport` (`'Moto'`), `type` (one of freestyle, racing, enduro), `lat` (number, WGS84), `lng` (number, WGS84). Optional: `description` (TEXT). Do not set `id` or `created_at` — the database fills those.
