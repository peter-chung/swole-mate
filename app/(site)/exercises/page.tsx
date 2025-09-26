"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "react-use";

import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/database.types";
import ExerciseCard from "./_components/ExerciseCard";
import SearchBar from "./_components/SearchBar";

type Exercise = Tables<"available_exercises">;

const Page = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  useDebounce(() => setDebouncedQuery(query), 500, [query]);

  const fetchExercises = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `/api/exercises?search=${encodeURIComponent(search)}`
        : "/api/exercises";
      const res = await fetch(url, { method: "GET" });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      setExercises(result.data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises(debouncedQuery);
  }, [debouncedQuery]);

  // Realtime: re-fetch when exercises change
  useEffect(() => {
    const channel = supabase
      .channel("custom-exercises-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "custom_exercises" },
        () => fetchExercises(debouncedQuery)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "custom_exercises" },
        () => fetchExercises(debouncedQuery)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "custom_exercises" },
        () => fetchExercises(debouncedQuery)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, debouncedQuery]); // re-bind if search filter changes

  return (
    <div className="py-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Exercises
        </h1>
        <Link
          href="/exercises/new"
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800 active:translate-y-px dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          + Create Exercise
        </Link>
      </div>

      <div className="mt-4">
        <SearchBar query={query} setQuery={setQuery} />
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-gray-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <span>Loading…</span>
        </div>
      ) : exercises.length > 0 ? (
        <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((exercise) => (
            <ExerciseCard exercise={exercise} key={exercise.id} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="text-3xl mb-2">🕵️‍♀️</div>
          <p className="font-medium">No exercises found</p>
          <p className="text-sm">
            Try a different search or create a new exercise.
          </p>
          <div className="mt-4">
            <Link
              href="/exercises/new"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-white dark:hover:bg-gray-900/40"
            >
              Create Exercise
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
