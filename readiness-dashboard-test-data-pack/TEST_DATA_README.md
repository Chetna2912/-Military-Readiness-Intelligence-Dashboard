# Dashboard Test Data

All records are synthetic and intended for testing only.

## Recommended upload order
1. `batch_01_units.csv`
2. `batch_01_personnel.csv`
3. `batch_01_equipment.csv`
4. `batch_01_maintenance.csv`
5. `batch_01_training.csv`
6. `batch_01_missions.csv`
7. `batch_01_incidents.csv`
8. `batch_01_logistics.csv`

Use **Upload & Review → Validate & Preview → Commit Upload**.

## Second test
Use the `batch_02_*_small.csv` files to test repeated uploads/upserts.

## Validation tests
- `INVALID_duplicate_primary_key_units.csv` should be rejected.
- `INVALID_missing_column_units.csv` should be rejected.

All IDs start with `TEST-` so they are easy to identify and remove from a development database.
