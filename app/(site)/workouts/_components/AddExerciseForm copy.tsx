"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Exercise = { id: string; name: string; type: string };

export default function AddExerciseForm({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: Exercise[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [exerciseId, setExerciseId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        (e.type ?? "").toLowerCase().includes(query)
    );
  }, [q, exercises]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!exerciseId) {
      setErrorMsg("Please select an exercise.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/workouts/${workoutId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_id: exerciseId }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed with ${res.status}`);
      }

      router.replace(`/workouts/${workoutId}`);
      router.refresh();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Search exercises
        </label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g., Bench Press, Running…"
          className="w-full rounded-lg border border-gray-300 bg-transparent p-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Exercise</label>
        <select
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-transparent p-2 outline-none focus:ring-2 focus:ring-indigo-500"
          size={8}
        >
          {filtered.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} {ex.type ? `· ${ex.type}` : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Showing {filtered.length} of {exercises.length}
        </p>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center rounded-xl px-4 py-2 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 hover:opacity-90 active:translate-y-px transition cursor-pointer disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add exercise"}
      </button>
    </form>
  );
}
