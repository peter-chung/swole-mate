-- Allow negative weight values to support assisted bodyweight exercises
-- (negative = assisted, 0 = bodyweight, positive = weighted)
ALTER TABLE exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_weight_check;
ALTER TABLE routine_sets DROP CONSTRAINT IF EXISTS exercise_sets_weight_check;
