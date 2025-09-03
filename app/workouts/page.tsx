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
    <div>
      <Link href="/workouts/create">Create Workout</Link>
      <h2 className="mt-4 mb-2 text-lg font-semibold">List of Workouts</h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="list-none p-0 space-y-2">
          {workouts.map((workout) => (
            <WorkoutCard workout={workout} key={workout.id} />
          ))}
          {workouts.length === 0 && (
            <p className="text-gray-500">No workouts found.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default Page;
