"use client";

import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import type { Tables, TablesUpdate } from "@/types/database.types";
import { InputField, TextAreaField } from "@/app/_components/FormFields";
import ConfirmDialog from "@/app/_components/ConfirmDialog";
import toast from "react-hot-toast";

type Routine = Tables<"routines">;
type RoutineUpdate = TablesUpdate<"routines">;

type Props = { routine: Routine | null };

export default function EditRoutineForm({ routine }: Props) {
  const [updatedRoutine, setUpdatedRoutine] = useState<Partial<RoutineUpdate>>(
    {}
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isUpdating, startUpdate] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!routine) return;

    const payloadEntries = Object.entries(updatedRoutine);
    if (payloadEntries.length === 0) {
      router.push(`/routines/${routine.id}`);
      return;
    }

    const sanitized: Partial<RoutineUpdate> = {};
    if (updatedRoutine.name !== undefined)
      sanitized.name =
        typeof updatedRoutine.name === "string"
          ? updatedRoutine.name.trim()
          : updatedRoutine.name;
    if (updatedRoutine.date !== undefined)
      sanitized.date =
        typeof updatedRoutine.date === "string"
          ? updatedRoutine.date
          : updatedRoutine.date;
    if (updatedRoutine.notes !== undefined)
      sanitized.notes =
        typeof updatedRoutine.notes === "string"
          ? updatedRoutine.notes
          : updatedRoutine.notes;
    if (updatedRoutine.status !== undefined)
      sanitized.status = updatedRoutine.status;

    startUpdate(async () => {
      try {
        const res = await fetch(`/api/routines/${routine.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitized),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "Failed to update");
        toast.success("Routine updated");
        router.push(`/routines/${routine.id}`);
      } catch (err) {
        console.error("Error updating routine:", err);
      }
    });
  };

  const handleDelete = async () => {
    if (!routine) return;
    startDelete(async () => {
      try {
        const res = await fetch(`/api/routines/${routine.id}`, {
          method: "DELETE",
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error ?? "Failed to delete");
        setConfirmOpen(false);
        toast.success("Routine deleted");
        router.push("/routines");
      } catch (err) {
        console.error("Error deleting routine:", err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Routine Details
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
          className="inline-flex items-center rounded-md border border-red-700 bg-transparent px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 active:translate-y-px disabled:opacity-60 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          {isDeleting ? "Deleting..." : "Delete Routine"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputField
          id="routineName"
          label="Routine Name"
          type="text"
          name="name"
          defaultValue={routine?.name ?? ""}
          onChange={(e) =>
            setUpdatedRoutine((p) => ({
              ...p,
              name: (e.target as HTMLInputElement).value,
            }))
          }
          required
        />
        <InputField
          id="routineDate"
          label="Date"
          type="date"
          name="date"
          defaultValue={routine?.date ?? ""}
          onChange={(e) =>
            setUpdatedRoutine((p) => ({
              ...p,
              date: (e.target as HTMLInputElement).value,
            }))
          }
          required
        />

        <TextAreaField
          id="routineNotes"
          label="Notes"
          name="notes"
          placeholder="Optional notes about this routine"
          defaultValue={routine?.notes ?? ""}
          containerClassName="sm:col-span-2"
          onChange={(e) =>
            setUpdatedRoutine((p) => ({
              ...p,
              notes: (e.target as HTMLTextAreaElement).value,
            }))
          }
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px disabled:opacity-60"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete routine?"
        description="This action is permanent and cannot be undone."
        destructive
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmLoading={isDeleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </form>
  );
}
