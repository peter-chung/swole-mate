-- Unify bodyweight exercise types: bodyweight_reps now supports signed weight
-- (negative = assisted, 0 = bodyweight, positive = weighted)
UPDATE exercise_types
SET has_weight = true, label = 'Bodyweight Reps'
WHERE key = 'bodyweight_reps';
