"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";
import WorkoutCard from "./_components/WorkoutCard";

type Workout = Tables<"workouts">;

const Page = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const url = "/api/workouts";
      const res = await fetch(url, { method: "GET" });
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
    fetchWorkouts();
  }, []);

  // 👇 Realtime: re-fetch when workouts change
  useEffect(() => {
    const channel = supabase
      .channel("workouts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workouts" },
        () => fetchWorkouts()
      )
      // (optional) keep list in sync if you edit/delete from elsewhere
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "workouts" },
        () => fetchWorkouts()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "workouts" },
        () => fetchWorkouts()
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
        <Link
          href="/workouts/create"
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 active:translate-y-px dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          + Create Workout
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-gray-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <span>Loading…</span>
        </div>
      ) : workouts.length > 0 ? (
        <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <WorkoutCard workout={workout} key={workout.id} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="text-3xl mb-2">🗓️</div>
          <p className="font-medium">No workouts yet</p>
          <p className="text-sm">Create your first workout to get started.</p>
          <div className="mt-4">
            <Link
              href="/workouts/create"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              Create Workout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
