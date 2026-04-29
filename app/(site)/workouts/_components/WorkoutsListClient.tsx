"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import WorkoutCard from "./WorkoutCard";
import type { WorkoutWithOwner } from "../_lib/getWorkoutsList";

type Props = {
  initialWorkouts: WorkoutWithOwner[];
  isAuthenticated: boolean;
};

const WorkoutsListClient = ({ initialWorkouts, isAuthenticated }: Props) => {
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workouts", { method: "GET" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      setWorkouts(result.data);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("workouts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workouts" },
        () => fetchWorkouts(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "workouts" },
        () => fetchWorkouts(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "workouts" },
        () => fetchWorkouts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Workouts
        </h1>
        {isAuthenticated ? (
          <Link
            href="/workouts/new"
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 active:translate-y-px dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            + Create Workout
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 active:translate-y-px dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            🔐 Log In to Create a Workout
          </Link>
        )}
      </div>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : workouts.length > 0 ? (
        <div className="mt-4 space-y-6">
          {Object.entries(
            workouts.reduce<Record<string, typeof workouts>>((groups, workout) => {
              const key = workout.date
                ? new Date(workout.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })
                : "No date";
              if (!groups[key]) groups[key] = [];
              groups[key].push(workout);
              return groups;
            }, {})
          ).map(([month, group]) => (
            <div key={month}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {month}
              </h2>
              <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((workout) => (
                  <WorkoutCard workout={workout} key={workout.id} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : isAuthenticated ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="text-3xl mb-2">🗓️</div>
          <p className="font-medium">No workouts yet</p>
          <p className="text-sm">Create your first workout to get started.</p>
          <div className="mt-4">
            <Link
              href="/workouts/new"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              Create Workout
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <p className="font-medium">
            Log in or create an account to build your workouts.
          </p>
          <p className="text-sm">
            Your workouts are saved to your account and available anywhere.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 active:translate-y-px dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsListClient;
