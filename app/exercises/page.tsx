"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "react-use";

import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/database.types";
import ExerciseCard from "./_components/ExerciseCard";
import SearchBar from "./_components/SearchBar";

type Exercise = Tables<"exercises">;

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

  // 👇 Realtime: re-fetch when exercises change
  useEffect(() => {
    const channel = supabase
      .channel("exercises-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "exercises" },
        () => fetchExercises(debouncedQuery)
      )
      // (optional) keep list in sync if you edit/delete from elsewhere
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "exercises" },
        () => fetchExercises(debouncedQuery)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "exercises" },
        () => fetchExercises(debouncedQuery)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, debouncedQuery]); // re-bind if search filter changes

  return (
    <div>
      <Link href="/exercises/create">Create Exercise</Link>
      <h2 className="mt-4 mb-2 text-lg font-semibold">List of Exercises</h2>

      <SearchBar query={query} setQuery={setQuery} />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="list-none p-0 space-y-2">
          {exercises.map((exercise) => (
            <ExerciseCard exercise={exercise} key={exercise.id} />
          ))}
          {exercises.length === 0 && (
            <p className="text-gray-500">No exercises found.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default Page;
