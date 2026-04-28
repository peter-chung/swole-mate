"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus } from "lucide-react";
import { InputField } from "@/app/_components/FormFields";
import toast from "react-hot-toast";

type Props = {
  workoutId: string;
  defaultTitle?: string;
  buttonClassName?: string;
  onButtonClick?: () => void;
};

export default function SaveAsRoutineButton({
  workoutId,
  defaultTitle,
  buttonClassName,
  onButtonClick,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/routines/from-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutId, title }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to save routine");
      toast.success("Routine created");
      setOpen(false);
      router.push(`/routines/${payload.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onButtonClick?.();
          setOpen(true);
        }}
        className={
          buttonClassName ??
          "inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200"
        }
      >
        <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
        <span>Save as routine</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !loading && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-neutral-900">
            <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
              Save as routine
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Confirm title for the new routine.
            </p>
            <div className="mb-4">
              <InputField
                id="routine-title"
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
