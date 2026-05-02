"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import type { TablesInsert } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import { createRoutineAction } from "../actions";
import Button from "@/app/_components/Button";

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
          router.push(`/routines/${result.id}/edit`);
        } else {
          router.push("/routines");
        }
      } catch (err) {
        console.error("Error creating routine:", err);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4">
        <Link
          href="/routines"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to routines</span>
        </Link>
      </div>
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
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

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
        >
          Create Routine
        </Button>
      </div>
    </form>
    </div>
  );
};

export default CreateRoutineForm;
