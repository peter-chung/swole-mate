"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { InputField, TextAreaField } from "@/app/_components/FormFields";

export default function CreateRoutineForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    "use client";

    import React, { useState } from "react";
    import { useRouter } from "next/navigation";
    import toast from "react-hot-toast";
    import { InputField, TextAreaField } from "@/app/_components/FormFields";

    export default function CreateRoutineForm() {
      const router = useRouter();
      const [name, setName] = useState("");
      const [notes, setNotes] = useState("");
      const [loading, setLoading] = useState(false);

      async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
          const res = await fetch("/api/routines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, notes }),
          });
          const payload = await res.json();
          if (!res.ok) throw new Error(payload?.error ?? "Failed");
          toast.success("Routine created");
          router.push(`/routines/${payload.id}`);
        } catch (err: any) {
          toast.error(err?.message ?? "Error");
        } finally {
          setLoading(false);
        }
      }

      return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Routine Details</div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputField id="name" label="Title" type="text" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} required />
            <div className="sm:col-span-2">
              <TextAreaField id="notes" label="Notes" name="notes" placeholder="Optional notes about this routine" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 active:translate-y-px disabled:opacity-60">
              {loading ? "Creating..." : "Create Routine"}
            </button>
          </div>
        </form>
      );
    }
