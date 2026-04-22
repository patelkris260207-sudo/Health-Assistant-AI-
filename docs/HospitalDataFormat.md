# Hospital Data Format

Each record in `data/hospitals.json`:

- `id` (string)
- `name` (string)
- `region`:
  - `country`
  - `state`
  - `city`
- `location`:
  - `lat`
  - `lng`
- `contact`:
  - `emergencyDesk`
  - `main`
- `acceptsAllEmergencies` (boolean)
- `specialties` (array: trauma/cardiac/stroke/pediatric/general/etc.)
- `status`:
  - `emergencyOpen` (boolean)
  - `reachable` (boolean)

Routing behavior:
- General emergency cases use only `acceptsAllEmergencies=true`.
- Specialty cases prioritize specialty hospitals, while still allowing all-emergency hospitals.
- Unreachable/closed/invalid-contact hospitals are skipped.
