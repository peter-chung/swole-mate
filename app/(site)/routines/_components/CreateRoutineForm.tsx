"use client";

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
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="space-y-5 py-4 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:p-6 sm:shadow-sm sm:dark:border-neutral-800 sm:dark:bg-neutral-900">
        <InputField
          id="routineName"
          label="Routine Name"
          type="text"
          placeholder="e.g., Push day!"
          name="name"
          autoComplete="off"
          className="!bg-transparent !shadow-none dark:!bg-transparent"
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
          className="!bg-transparent !shadow-none dark:!bg-transparent"
          value={routine.notes ?? ""}
          onChange={(e) =>
            setRoutine((prev) => ({
              ...prev,
              notes: (e.target as HTMLTextAreaElement).value,
            }))
          }
          onClear={() => setRoutine((prev) => ({ ...prev, notes: "" }))}
        />

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            className="w-full sm:w-auto"
          >
            Create Routine
          </Button>
        </div>
      </div>
    </form>
    </div>
  );
};

export default CreateRoutineForm;
