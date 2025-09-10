"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Tables } from "@/types/database.types";
import EditWorkoutForm from "../../_components/EditWorkoutForm";
import AddWorkoutExerciseModal from "../../_components/AddWorkoutExerciseModal";
import EditExerciseForm from "../../_components/EditExerciseForm";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import { toast } from "react-hot-toast";
import ExerciseSetForm, { ExerciseSetFormHandle } from "../../_components/ExerciseSetForm";

type Workout = Tables<"workouts">;

const EditWorkoutPage = () => {
  const params = useParams();
  const workoutId = params.id as string;
  const [workout, setWorkout] = useState<Workout | null>(null);
  // const [activities, setActivities] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [confirmExerciseId, setConfirmExerciseId] = useState<number | null>(null);

  // Keep refs to each ExerciseSetForm by workoutExerciseId
  const formRefs = useRef<Record<number, ExerciseSetFormHandle | null>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<number, boolean>>({});
  const anyDirty = (workout?.workout_exercises ?? []).some((we) => !!dirtyMap[we.id]);

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workouts/${encodeURIComponent(workoutId)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setWorkout(result.data);
      // Reset dirty indicators after a full refresh from server
      setDirtyMap({});
    } catch (err) {
      console.error("Error fetching workout:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);


  const handleDeleteExercise = async (workoutExerciseId: number) => {
    if (!workoutExerciseId) return;
    try {
      setDeletingId(workoutExerciseId);
      const res = await fetch(
        `/api/workouts/${encodeURIComponent(
          workoutId
        )}/workout-exercises/${workoutExerciseId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      // Refresh workout details after deletion
      await fetchWorkout();
    } catch (err) {
      console.error("Error deleting workout exercise:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete exercise"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-4 sm:mb-6">
        <div className="mb-2">
          <Link
            href={workout ? `/workouts/${workout.id}` : "/workouts"}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span aria-hidden>←</span>
            <span>Back to workout</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Workout</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {workout?.name ? (
            <span className="truncate">{workout.name}</span>
          ) : (
            workout?.date && <span className="truncate">{workout.date}</span>
          )}
          {workout?.status && (
            <span className="inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {workout.status}
            </span>
          )}
        </div>
      </header>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-6">
        <EditWorkoutForm workout={workout} />
      </section>

      <section className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-900 dark:text-white">Exercises</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!workout?.workout_exercises?.length) return;
              try {
                setSavingAll(true);
                const saves = workout.workout_exercises.map(async (we) => {
                  const handle = formRefs.current[we.id];
                  if (handle?.save) {
                    try {
                      await handle.save({ silent: true });
                    } catch (e) {
                      // Bubble up but continue others
                      throw new Error(
                        `Failed saving sets for exercise ${we.exercise?.name ?? we.id}`
                      );
                    }
                  }
                });
                await Promise.all(saves);
                await fetchWorkout();
                toast.success("All sets saved");
              } catch (err) {
                console.error(err);
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to save some exercises"
                );
              } finally {
                setSavingAll(false);
              }
            }}
            disabled={savingAll || loading || !anyDirty}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
          >
            {savingAll ? "Saving All…" : anyDirty ? "Save All Sets" : "No Changes"}
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 active:translate-y-px cursor-pointer dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
          >
            + Add Exercise
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
          Loading…
        </div>
      ) : workout?.workout_exercises && workout.workout_exercises.length > 0 ? (
        <div className="space-y-4">
          {workout.workout_exercises.map((we) => (
            <div
              key={we.id}
              className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/40 sm:p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {we.exercise?.name ?? "Exercise"}
                    {dirtyMap[we.id] ? (
                      <span className="ml-2 inline-flex items-center rounded-full border border-amber-400 px-2 py-0.5 text-[10px] font-normal text-amber-700 dark:border-amber-500 dark:text-amber-400">
                        Unsaved changes
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {we.id}</p>
                </div>
                <div className="sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => setConfirmExerciseId(we.id)}
                    disabled={deletingId === we.id || loading}
                    className="inline-flex items-center rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    {deletingId === we.id ? "Deleting…" : "Delete Exercise"}
                  </button>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <ExerciseSetForm
                  workoutId={workoutId}
                  workoutExerciseId={we.id}
                  exerciseSets={we.exercise_sets}
                  onSaved={fetchWorkout}
                  onDirtyChange={(dirty) =>
                    setDirtyMap((prev) => ({ ...prev, [we.id]: dirty }))
                  }
                  ref={(handle) => {
                    formRefs.current[we.id] = handle;
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
          No exercises yet. Use “Add Exercise” to begin.
        </div>
      )}

      <AddWorkoutExerciseModal
        open={isAddModalOpen}
        workoutId={workoutId}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          // refresh workout details after adding an exercise
          fetchWorkout();
        }}
      />

      <ConfirmDialog
        open={!!confirmExerciseId}
        title="Delete exercise?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={deletingId === confirmExerciseId ? "Deleting..." : "Delete"}
        confirmLoading={deletingId === confirmExerciseId}
        onCancel={() => setConfirmExerciseId(null)}
        onConfirm={async () => {
          if (!confirmExerciseId) return;
          await handleDeleteExercise(confirmExerciseId);
          setConfirmExerciseId(null);
        }}
      />
    </div>
  );
};

export default EditWorkoutPage;
