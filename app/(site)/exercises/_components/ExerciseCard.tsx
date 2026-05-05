"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, User } from "lucide-react";
import type { Tables } from "@/types/database.types";

type Exercise = Tables<"available_exercises">;

const ExerciseCard = ({ exercise, isAdmin = false }: { exercise: Exercise; isAdmin?: boolean }) => {
  const muscle = exercise.primary_muscle?.trim() || null;
  const secondaryMuscles = exercise.other_muscles?.trim();
  const typeLabel = exercise.exercise_type_label?.trim();
  const otherMuscleBadges = secondaryMuscles
    ? secondaryMuscles
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const isCustom = exercise.source === "custom";
  const isAdminPublic = isAdmin && exercise.source === "public";
  const cardBaseClasses =
    "flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]/60 dark:border-neutral-800 dark:bg-neutral-900";

  const content = (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 transition group-hover:text-[#3ecf8e] dark:text-gray-100 dark:group-hover:text-[#3ecf8e]">
            <span>{exercise.name}</span>
            {isCustom ? (
              <User className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-label="Custom exercise" />
            ) : (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" aria-label="Official exercise" />
            )}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            {muscle ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/40">
                Primary · {muscle}
              </span>
            ) : null}
            {typeLabel ? (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/30">
                {typeLabel}
              </span>
            ) : null}
          </div>
          {otherMuscleBadges.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {otherMuscleBadges.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:ring-neutral-700"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <li className="h-full">
      {isCustom || isAdminPublic ? (
        <Link
          href={
            isAdminPublic
              ? `/exercises/${exercise.id}/edit/public`
              : `/exercises/${exercise.id}`
          }
          className={`${cardBaseClasses} group transition hover:-translate-y-0.5 hover:shadow-md`}
        >
          {content}
        </Link>
      ) : (
        <div className={`${cardBaseClasses} cursor-default`}>{content}</div>
      )}
    </li>
  );
};

export default ExerciseCard;
