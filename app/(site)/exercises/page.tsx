"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useDebounce } from "react-use";

import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/database.types";
import ExerciseCard from "./_components/ExerciseCard";
import SearchBar from "./_components/SearchBar";

type Exercise = Tables<"available_exercises">;

const PAGE_SIZE = 24;

const Page = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentQuery, setCurrentQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  useDebounce(() => setDebouncedQuery(query), 500, [query]);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadExercises = useCallback(
    async (searchTerm: string, pageIndex: number, append: boolean) => {
      const startLoading = append
        ? () => setLoadingMore(true)
        : () => setLoading(true);
      const stopLoading = append
        ? () => setLoadingMore(false)
        : () => setLoading(false);

      startLoading();
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      try {
        const offset = pageIndex * PAGE_SIZE;
        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: offset.toString(),
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const res = await fetch(`/api/exercises?${params.toString()}`, {
          method: "GET",
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const exercisesData = Array.isArray(result.data)
          ? (result.data as Exercise[])
          : [];
        const total =
          typeof result.count === "number"
            ? result.count
            : offset + exercisesData.length;
        const moreAvailable =
          typeof result.count === "number"
            ? offset + exercisesData.length < result.count
            : exercisesData.length === PAGE_SIZE;

        setTotalCount(total);
        setHasMore(moreAvailable);
        setPage(pageIndex + 1);

        if (append) {
          setExercises((prev) => {
            const next = new Map(prev.map((item) => [item.id, item]));
            exercisesData.forEach((item) => {
              next.set(item.id, item);
            });
            return Array.from(next.values());
          });
        } else {
          setExercises(exercisesData);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        if (requestId === requestIdRef.current) {
          stopLoading();
        }
      }
    },
    []
  );

  const initializeResults = useCallback(
    (searchTerm: string) => {
      setCurrentQuery(searchTerm);
      setExercises([]);
      setPage(0);
      setHasMore(true);
      setLoadingMore(false);
      setTotalCount(0);
      loadExercises(searchTerm, 0, false);
    },
    [loadExercises]
  );

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();
    initializeResults(normalizedQuery);
  }, [debouncedQuery, initializeResults]);

  // Realtime: re-fetch when exercises change
  useEffect(() => {
    const channel = supabase
      .channel("custom-exercises-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "custom_exercises" },
        () => initializeResults(currentQuery)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "custom_exercises" },
        () => initializeResults(currentQuery)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "custom_exercises" },
        () => initializeResults(currentQuery)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, initializeResults, currentQuery]); // re-bind if search filter changes

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loading && !loadingMore) {
          loadExercises(currentQuery, page, true);
        }
      },
      { rootMargin: "200px 0px", threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, loadExercises, currentQuery, page]);

  const loadedCount = exercises.length;
  const totalLabel = totalCount > 0 ? totalCount : loadedCount;

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
        <>
          <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <ExerciseCard exercise={exercise} key={exercise.id} />
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loaded {loadedCount} of {totalLabel} exercises
            </p>
            <div
              ref={loadMoreRef}
              className="h-10 w-full max-w-sm rounded-lg border border-dashed border-transparent"
              aria-hidden="true"
            />
            {loadingMore && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                <span>Loading more…</span>
              </div>
            )}
            {!hasMore && !loadingMore && (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  You&apos;ve reached the end.
                </p>
                <button
                  type="button"
                  onClick={handleScrollToTop}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200 dark:hover:bg-gray-900"
                >
                  Back to top
                </button>
              </div>
            )}
          </div>
        </>
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
