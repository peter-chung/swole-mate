"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Tables } from "@/types/database.types";

type RoutineWithExercises = Tables<"routines"> & {
  routine_exercises?: Array<
    Tables<"routine_exercises"> & {
      routine_sets?: Array<Tables<"routine_sets">>;
      exercise?: any;
    }
  >;
};

export default function RoutineDetailClient({
  routineId,
}: {
  routineId: string;
}) {
  const [data, setData] = useState<RoutineWithExercises | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/routines/${routineId}`);
        const payload = await res.json();
        if (!res.ok)
          throw new Error(payload?.error ?? "Failed to load routine");
        if (!cancelled) setData(payload.data ?? null);
      } catch (err: any) {
        toast.error(err?.message ?? "Error loading routine");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [routineId]);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>Not found.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <h2 className="text-xl font-semibold">{data.name ?? "Untitled"}</h2>
        {data.notes && (
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
            {data.notes}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium">Exercises</h3>
        <ul className="space-y-3 mt-2">
          {(data.routine_exercises ?? []).map((re) => (
            <li key={re.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    {re.exercise?.name ??
                      (re.custom_exercise_id ? "Custom" : "Exercise")}
                  </div>
                  {re.notes && (
                    <div className="text-sm text-gray-600">{re.notes}</div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Sets: {(re.routine_sets ?? []).length}
                </div>
              </div>
              {(re.routine_sets ?? []).length > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  {re.routine_sets?.map((s) => (
                    <div key={s.id} className="flex gap-3">
                      <div>Set {s.set_number}:</div>
                      <div>{s.reps ?? "-"} reps</div>
                      <div>{s.weight ? `${s.weight} kg` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
