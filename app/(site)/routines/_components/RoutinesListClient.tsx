"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import RoutineCard from "./RoutineCard";
import type { Tables } from "@/types/database.types";
import type { RoutineWithOwner } from "../_lib/getRoutinesList";

type Routine = Tables<"routines"> & {
  user?: { id: string; username?: string | null; full_name?: string | null };
};

type Props = { initialRoutines?: RoutineWithOwner[] };

export default function RoutinesListClient({ initialRoutines = [] }: Props) {
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/routines", { method: "GET" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setRoutines(result.data ?? []);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("routines-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "routines" },
        () => fetchRoutines()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "routines" },
        () => fetchRoutines()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "routines" },
        () => fetchRoutines()
      )
      .subscribe();

    // initial load
    fetchRoutines();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Routines
        </h1>
        <Link
          href="/routines/new"
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 active:translate-y-px dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          + Create Routine
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : routines.length > 0 ? (
        <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((r) => (
            <RoutineCard routine={r} key={r.id} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="text-3xl mb-2">🏋️‍♂️</div>
          <p className="font-medium">No routines yet</p>
          <p className="text-sm">Create your first routine to get started.</p>
          <div className="mt-4">
            <Link
              href="/routines/new"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              Create Routine
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
