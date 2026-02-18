-- Remove unused workout fields
ALTER TABLE public.workouts
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS started_at,
  DROP COLUMN IF EXISTS ended_at;
