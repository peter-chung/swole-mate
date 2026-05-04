ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS equipment_brand TEXT;

ALTER TABLE public.routine_exercises
  ADD COLUMN IF NOT EXISTS equipment_brand TEXT;
