# How to seed mountain biking (MTB) spot data — instructions for Gemini

Use this when researching and generating real-world MTB spots to insert into our map.

---

## Table and format

- **Table:** `public.spots`
- **Columns you must provide:** `name`, `sport`, `type`, `lat`, `lng`
- **Optional:** `description`
- **Do not set:** `id`, `created_at` (database fills these)

## Rules for MTB spots

1. **Sport:** Always use exactly **`MTB`** (uppercase). No other value.

2. **Type:** Must be exactly one of these **lowercase** values (no variations):
   - `park` — bike parks, lift-served or shuttle
   - `trail` — trail systems, XC, singletrack
   - `downhill` — downhill-focused
   - `enduro` — enduro trails
   - `dirt` — dirt jumps, pump tracks, etc.

3. **Coordinates:** WGS84 decimal degrees. `lat` and `lng` are required numbers (e.g. `35.2134`, `-82.6021`).

4. **One row per place:** One physical location = one row. Do not create two rows for the same trail system or park.

5. **Upsert:** Rows are inserted with `ON CONFLICT (name, lat, lng) DO UPDATE`. So same name + same lat/lng = update existing row, no duplicate. Use a consistent, canonical name per location.

---

## Output format we need

**SQL (for the migration file `supabase/migrations/20260210000000_seed_real_spots.sql`):**

Add lines to the existing `VALUES` list. Each row is a 6-tuple: `(name, sport, type, lat, lng, description)`.

- Strings in **single quotes**; use `''` to escape a single quote inside a string.
- `description` can be `NULL` if unknown.
- End each line except the last with a comma.

Example:

```sql
  ('DuPont State Forest', 'MTB', 'trail', 35.2134, -82.6021, 'Western NC trail system.'),
  ('Pisgah - Black Mountain', 'MTB', 'trail', 35.4521, -82.7234, 'Technical singletrack near Asheville.'),
  ('Beech Mountain Bike Park', 'MTB', 'park', 36.0876, -81.8823, 'Lift-served bike park.'),
  ('Windrock Bike Park', 'MTB', 'downhill', 36.0987, -84.3210, NULL),
```

**Or JSON (if generating for a script):**

One object per spot; keys: `name`, `sport`, `type`, `lat`, `lng`, `description` (optional).

```json
{ "name": "DuPont State Forest", "sport": "MTB", "type": "trail", "lat": 35.2134, "lng": -82.6021, "description": "Western NC trail system." }
```

---

## Checklist before submitting

- [ ] `sport` is exactly `MTB`
- [ ] `type` is one of: `park`, `trail`, `downhill`, `enduro`, `dirt`
- [ ] `lat` and `lng` are numbers in WGS84
- [ ] No duplicate locations (one row per place)
- [ ] Names are consistent and human-readable (e.g. "DuPont State Forest", not "dupont_state_forest")

Full schema and other sports: see `docs/SPOTS_DATA_REFERENCE.md` in the same repo.
