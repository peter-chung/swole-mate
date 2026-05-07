-- Ensure bodyweight_reps label is correct
UPDATE exercise_types
SET label = 'Bodyweight Reps'
WHERE key = 'bodyweight_reps';
