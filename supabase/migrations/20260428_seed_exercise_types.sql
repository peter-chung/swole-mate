INSERT INTO exercise_types (key, label, has_weight, has_reps, has_duration, has_distance, is_bodyweight, is_assisted)
VALUES
  ('weight_reps',        'Weight & Reps',        true,  true,  false, false, false, false),
  ('bodyweight_reps',    'Bodyweight Reps',       false, true,  false, false, true,  false),
  ('weighted_bodyweight','Weighted Bodyweight',   true,  true,  false, false, true,  false),
  ('duration',           'Duration',              false, false, true,  false, false, false),
  ('distance_duration',  'Distance & Duration',   false, false, true,  true,  false, false),
  ('weight_duration',    'Weight & Duration',     true,  false, true,  false, false, false)
ON CONFLICT (key) DO NOTHING;
