"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function startDemo() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    return { error: error?.message ?? "Failed to start demo" };
  }

  await seedDemoData(data.user.id);

  revalidatePath("/", "layout");
  redirect("/workouts");
}

async function seedDemoData(userId: string) {
  const supabase = await createClient();

  // profiles.id is a FK target for workouts — ensure the row exists
  await supabase.from("profiles").upsert({ id: userId, updated_at: new Date().toISOString() });

  const { data: exercises } = await supabase
    .from("public_exercises")
    .select("id, name")
    .limit(9);

  if (!exercises || exercises.length === 0) return;

  const pick = (start: number, count: number) =>
    Array.from({ length: count }, (_, i) => exercises[(start + i) % exercises.length]);

  const today = new Date();
  const dateOffset = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };

  const templates = [
    {
      name: "Push Day 💪",
      date: dateOffset(1),
      notes: "Felt strong today!",
      exercises: pick(0, 3),
      sets: [
        [{ set_number: 1, reps: 12, weight: 135 }, { set_number: 2, reps: 10, weight: 145 }, { set_number: 3, reps: 8, weight: 155 }],
        [{ set_number: 1, reps: 15, weight: 45 }, { set_number: 2, reps: 12, weight: 50 }, { set_number: 3, reps: 10, weight: 55 }],
        [{ set_number: 1, reps: 12, weight: 60 }, { set_number: 2, reps: 10, weight: 65 }, { set_number: 3, reps: 8, weight: 70 }],
      ],
    },
    {
      name: "Pull Day 🏋️",
      date: dateOffset(3),
      notes: null,
      exercises: pick(3, 3),
      sets: [
        [{ set_number: 1, reps: 8, weight: 185 }, { set_number: 2, reps: 6, weight: 205 }, { set_number: 3, reps: 5, weight: 215 }],
        [{ set_number: 1, reps: 12, weight: 100 }, { set_number: 2, reps: 10, weight: 110 }, { set_number: 3, reps: 8, weight: 120 }],
        [{ set_number: 1, reps: 15, weight: 35 }, { set_number: 2, reps: 12, weight: 40 }, { set_number: 3, reps: 10, weight: 45 }],
      ],
    },
    {
      name: "Leg Day 🦵",
      date: dateOffset(5),
      notes: "PRs all around!",
      exercises: pick(6, 3),
      sets: [
        [{ set_number: 1, reps: 10, weight: 225 }, { set_number: 2, reps: 8, weight: 245 }, { set_number: 3, reps: 6, weight: 265 }],
        [{ set_number: 1, reps: 12, weight: 180 }, { set_number: 2, reps: 10, weight: 190 }, { set_number: 3, reps: 8, weight: 200 }],
        [{ set_number: 1, reps: 15, weight: 90 }, { set_number: 2, reps: 12, weight: 100 }, { set_number: 3, reps: 10, weight: 110 }],
      ],
    },
  ];

  for (const template of templates) {
    const { data: workout } = await supabase
      .from("workouts")
      .insert({ user_id: userId, name: template.name, date: template.date, notes: template.notes })
      .select("id")
      .single();

    if (!workout) continue;

    for (let i = 0; i < template.exercises.length; i++) {
      const { data: we } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workout.id,
          user_id: userId,
          public_exercise_id: template.exercises[i].id,
          order_index: i,
        })
        .select("id")
        .single();

      if (!we) continue;

      await supabase.from("exercise_sets").insert(
        template.sets[i].map((s) => ({ ...s, workout_exercise_id: we.id, user_id: userId }))
      );
    }
  }
}
