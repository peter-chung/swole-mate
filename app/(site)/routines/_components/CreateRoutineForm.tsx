"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import type { TablesInsert } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import { createRoutineAction } from "../actions";

type NewRoutine = TablesInsert<"routines">;

const CreateRoutineForm = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const [routine, setRoutine] = useState<Partial<NewRoutine>>({
    date: today,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = typeof routine.name === "string" ? routine.name.trim() : "";
    if (!name) return;

    const notes =
      typeof routine.notes === "string" && routine.notes.length > 0
        ? routine.notes
        : null;

    startTransition(async () => {
      try {
        const result = await createRoutineAction({
          name,
          date: today,
          notes,
        });

        if (result?.id) {
          router.push(`/routines/${result.id}/exercises/edit`);
        } else {
          router.push("/routines");
        }
      } catch (err) {
        console.error("Error creating routine:", err);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900"
    >
      <InputField
        id="routineName"
        label="Routine Name"
        type="text"
        placeholder="e.g., Push day!"
        name="name"
        autoComplete="off"
        onChange={(e) =>
          setRoutine((prev) => ({
            ...prev,
            name: (e.target as HTMLInputElement).value,
          }))
        }
        required
      />

      <TextAreaField
        id="routineNotes"
        label="Notes"
        name="notes"
        placeholder="Optional notes about this routine"
        onChange={(e) =>
          setRoutine((prev) => ({
            ...prev,
            notes: (e.target as HTMLTextAreaElement).value,
          }))
        }
      />

      <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/routines"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>Back to routines</span>
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create Routine"}
        </button>
      </div>
    </form>
  );
};

export default CreateRoutineForm;
