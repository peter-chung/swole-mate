"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import { useDebounce } from "react-use";

import { createClient } from "@/utils/supabase/client";
import LoadingSpinner from "@/app/_components/LoadingSpinner";
import ExerciseCard from "./ExerciseCard";
import SearchBar from "./SearchBar";
import type { AvailableExercise } from "../_lib/types";
import { EXERCISES_PAGE_SIZE } from "../_lib/constants";
import { ButtonLink } from "@/app/_components/Button";

type Props = {
  initialExercises: AvailableExercise[];
  initialCount: number;
  initialQuery?: string;
  isAuthenticated: boolean;
  isAdmin?: boolean;
};

const ExercisesListClient = ({
  initialExercises,
  initialCount,
  initialQuery = "",
  isAuthenticated,
  isAdmin = false,
}: Props) => {
  const [exercises, setExercises] = useState<AvailableExercise[]>(
    initialExercises
  );
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(
    initialExercises.length > 0 ? 1 : 0
  );
  const [totalCount, setTotalCount] = useState(initialCount);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [hasMore, setHasMore] = useState(
    initialCount > initialExercises.length
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const hasInitializedRef = useRef(false);

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
        const offset = pageIndex * EXERCISES_PAGE_SIZE;
        const params = new URLSearchParams({
          limit: EXERCISES_PAGE_SIZE.toString(),
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
          ? (result.data as AvailableExercise[])
          : [];
        const total =
          typeof result.count === "number"
            ? result.count
            : offset + exercisesData.length;
        const moreAvailable =
          typeof result.count === "number"
            ? offset + exercisesData.length < result.count
            : exercisesData.length === EXERCISES_PAGE_SIZE;

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
    return () => {
      hasInitializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }
    const normalizedQuery = debouncedQuery.trim();
    initializeResults(normalizedQuery);
  }, [debouncedQuery, initializeResults]);

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
  }, [supabase, initializeResults, currentQuery]);

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
        <div className="hidden sm:flex sm:items-center sm:gap-2">
          {isAdmin && (
            <ButtonLink href="/exercises/new/public" variant="secondary" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Public Exercise
            </ButtonLink>
          )}
          <ButtonLink href="/exercises/new" variant="primary" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Exercise
          </ButtonLink>
        </div>
      </div>

      <div className="mt-4">
        <SearchBar query={query} setQuery={setQuery} />
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:hidden">
        {isAdmin && (
          <ButtonLink href="/exercises/new/public" variant="secondary" className="w-full gap-1.5">
            <Plus className="h-4 w-4" />
            New Public Exercise
          </ButtonLink>
        )}
        <ButtonLink href="/exercises/new" variant="primary" className="w-full gap-1.5">
          <Plus className="h-4 w-4" />
          New Exercise
        </ButtonLink>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-6" />
      ) : exercises.length > 0 ? (
        <>
          <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <ExerciseCard exercise={exercise} key={exercise.id} isAdmin={isAdmin} />
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {loadedCount} of {totalLabel}
            </p>
            <div
              ref={loadMoreRef}
              className="h-10 w-full max-w-sm rounded-lg border border-dashed border-transparent"
              aria-hidden="true"
            />
            {loadingMore && <LoadingSpinner label="Loading more…" />}
            {!hasMore && !loadingMore && (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  You&apos;ve reached the end.
                </p>
                <button
                  type="button"
                  onClick={handleScrollToTop}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-gray-200 dark:hover:bg-neutral-900"
                >
                  Back to top
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600 dark:border-neutral-700 dark:text-gray-300">
          <div className="text-3xl mb-2">🕵️‍♀️</div>
          <p className="font-medium">No exercises found</p>
          <p className="text-sm">Try a different search or create a new exercise.</p>
          <div className="mt-4">
            <ButtonLink href="/exercises/new" variant="primary">
              Create Exercise
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisesListClient;
