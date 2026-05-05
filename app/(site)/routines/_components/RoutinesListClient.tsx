"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import RoutineCard from "./RoutineCard";
import type { RoutineWithOwner } from "../_lib/getRoutinesList";
import { ButtonLink } from "@/app/_components/Button";

type Props = {
  initialRoutines?: RoutineWithOwner[];
  isAuthenticated: boolean;
};

export default function RoutinesListClient({
  initialRoutines = [],
  isAuthenticated,
}: Props) {
  const [routines, setRoutines] = useState<RoutineWithOwner[]>(initialRoutines);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/routines", { method: "GET" });
      const result = await res.json();
      if (res.status === 401) {
        setRoutines([]);
        return;
      }
      if (!res.ok) throw new Error(result?.error || "Failed to fetch routines");
      setRoutines(result.data ?? []);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, supabase]);

  return (
    <>
      {loading ? (
        <LoadingSpinner className="mt-4" />
      ) : routines.length > 0 ? (
        <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((r) => (
            <RoutineCard routine={r} key={r.id} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-neutral-700 dark:text-gray-300">
          <div className="text-3xl mb-2">🏋️‍♂️</div>
          <p className="font-medium">No routines yet</p>
          <p className="text-sm">Create your first routine to get started.</p>
          <div className="mt-4">
            <ButtonLink href="/routines/new" variant="primary">
              Create Routine
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
