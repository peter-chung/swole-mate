-- Convert other_muscles from comma-separated text to text[]
-- Must drop and recreate the available_exercises view since it depends on the column

DROP VIEW IF EXISTS available_exercises;

ALTER TABLE public_exercises
  ALTER COLUMN other_muscles TYPE text[]
  USING CASE
    WHEN other_muscles IS NULL OR trim(other_muscles) = '' THEN NULL
    ELSE string_to_array(trim(other_muscles), ', ')
  END;

ALTER TABLE custom_exercises
  ALTER COLUMN other_muscles TYPE text[]
  USING CASE
    WHEN other_muscles IS NULL OR trim(other_muscles) = '' THEN NULL
    ELSE string_to_array(trim(other_muscles), ', ')
  END;

CREATE VIEW available_exercises WITH (security_invoker = on) AS
SELECT
  pe.id,
  pe.name,
  pe.primary_muscle,
  pe.other_muscles,
  pe.exercise_type_id,
  pe.created_at,
  et.key  AS exercise_type_key,
  et.label AS exercise_type_label,
  et.has_weight,
  et.has_reps,
  et.has_duration,
  et.has_distance,
  et.is_bodyweight,
  et.is_assisted,
  'public'::text AS source,
  NULL::uuid AS user_id
FROM public_exercises pe
JOIN exercise_types et ON pe.exercise_type_id = et.id

UNION ALL

SELECT
  ce.id,
  ce.name,
  ce.primary_muscle,
  ce.other_muscles,
  ce.exercise_type_id,
  ce.created_at,
  et.key  AS exercise_type_key,
  et.label AS exercise_type_label,
  et.has_weight,
  et.has_reps,
  et.has_duration,
  et.has_distance,
  et.is_bodyweight,
  et.is_assisted,
  'custom'::text AS source,
  ce.user_id
FROM custom_exercises ce
JOIN exercise_types et ON ce.exercise_type_id = et.id;
