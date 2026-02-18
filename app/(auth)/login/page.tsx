"use client";

import { login, signup } from "./actions";
import Link from "next/link";
import { FormEvent } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<any>,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);

    if (result?.error) {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 justify-center">
          <span aria-hidden className="text-3xl leading-none">
            💪
          </span>
          <span className="text-xl font-semibold">Swole Mate</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            Welcome back
          </h1>
          <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-300">
            Log in to continue your training
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => handleSubmit(e, login)}
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
              />
            </div>

            <div className="pt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = (e.target as HTMLElement).closest("form");
                  if (form) {
                    handleSubmit(
                      {
                        preventDefault: () => {},
                        currentTarget: form,
                      } as FormEvent<HTMLFormElement>,
                      signup,
                    );
                  }
                }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 transition hover:bg-gray-50 hover:opacity-90 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-800/70"
              >
                Create account
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              <Link href="/" className="underline hover:no-underline">
                Back to home
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
