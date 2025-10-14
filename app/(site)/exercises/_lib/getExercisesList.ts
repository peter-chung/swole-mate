import { createClient } from "@/utils/supabase/server";
import { EXERCISES_PAGE_SIZE } from "./constants";
import type { AvailableExercise } from "./types";

export async function getInitialExercises(searchTerm = ""): Promise<{
  items: AvailableExercise[];
  count: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { items: [], count: 0 };
  }

  let query = supabase
    .from("available_exercises")
    .select("*", { count: "exact" })
    .order("source", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .range(0, EXERCISES_PAGE_SIZE - 1);

  if (searchTerm) {
    const term = searchTerm.replace(/,/g, "");
    query = query.or(
      [
        `name.ilike.%${term}%`,
        `exercise_type_label.ilike.%${term}%`,
        `exercise_type_key.ilike.%${term}%`,
        `primary_muscle.ilike.%${term}%`,
        `other_muscles.ilike.%${term}%`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return { items: [], count: 0 };
  }

  return { items: data, count: count ?? data.length };
}
