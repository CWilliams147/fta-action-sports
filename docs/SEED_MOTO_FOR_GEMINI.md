# How to seed Moto (motorcycle) spot data — instructions for Gemini

Use this when researching and generating real-world Moto spots to insert into our map (motocross tracks, freestyle venues, enduro/trail areas, etc.).

---

## Table and format

- **Table:** `public.spots`
- **Columns you must provide:** `name`, `sport`, `type`, `lat`, `lng`
- **Optional:** `description`
- **Do not set:** `id`, `created_at` (database fills these)

## Rules for Moto spots

1. **Sport:** Always use exactly **`Moto`** (capital M, rest lowercase). No other value (e.g. not "Motocross", not "Motorcycle").

2. **Type:** Must be exactly one of these **lowercase** values (no variations):
   - `freestyle` — freestyle motocross (FMX), arenacross, demos, freestyle venues
   - `racing` — motocross (MX) tracks, supercross (SX), race circuits, practice tracks
   - `enduro` — enduro, trail riding, off-road areas, hare scrambles

3. **Coordinates:** WGS84 decimal degrees. `lat` and `lng` are required numbers (e.g. `33.6681`, `-117.3272`).

4. **One row per place:** One physical location = one row. Do not create two rows for the same track or riding area.

5. **Upsert:** Rows are inserted with `ON CONFLICT (name, lat, lng) DO UPDATE`. Same name + same lat/lng = update existing row, no duplicate. Use a consistent, canonical name per location.

---

## Output format we need

**SQL (for the migration file `supabase/migrations/20260210000000_seed_real_spots.sql`):**

Add lines to the existing `VALUES` list. Each row is a 6-tuple: `(name, sport, type, lat, lng, description)`.

- Strings in **single quotes**; use `''` to escape a single quote inside a string.
- `description` can be `NULL` if unknown.
- End each line except the last with a comma.

Example:

```sql
  ('Lake Elsinore MX Park', 'Moto', 'racing', 33.6681, -117.3272, 'SoCal motocross track.'),
  ('Milestone Ranch', 'Moto', 'racing', 33.8923, -117.0456, 'MX and supercross facility.'),
  ('Glen Helen Raceway', 'Moto', 'racing', 34.1567, -117.4234, NULL),
```

**Or JSON (if generating for a script):**

One object per spot; keys: `name`, `sport`, `type`, `lat`, `lng`, `description` (optional).

```json
{ "name": "Lake Elsinore MX Park", "sport": "Moto", "type": "racing", "lat": 33.6681, "lng": -117.3272, "description": "SoCal motocross track." }
```

---

## Checklist before submitting

- [ ] `sport` is exactly `Moto` (not Motocross, Motorcycle, etc.)
- [ ] `type` is one of: `freestyle`, `racing`, `enduro`
- [ ] `lat` and `lng` are numbers in WGS84
- [ ] No duplicate locations (one row per place)
- [ ] Names are consistent and human-readable (e.g. "Glen Helen Raceway", not "glen_helen_raceway")

Full schema and other sports: see `docs/SPOTS_DATA_REFERENCE.md` in the same repo.
