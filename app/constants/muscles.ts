export const MUSCLE_GROUPS = [
  "Back",
  "Biceps",
  "Calves",
  "Chest",
  "Core",
  "Forearms",
  "Glutes",
  "Hamstrings",
  "Quads",
  "Shoulders",
  "Traps",
  "Triceps",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
