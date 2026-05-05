"use client";

import { signup } from "./actions";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Button from "@/app/_components/Button";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    const result = await signup(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-start sm:items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <div className="sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white sm:p-6 sm:shadow-sm sm:dark:border-neutral-800 sm:dark:bg-neutral-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            Create your account
          </h1>
          <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-300">
            Start tracking your gains today 🏋️
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="johndoe"
                className="block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20 dark:border-neutral-700 dark:text-gray-100 sm:bg-white sm:shadow-sm sm:dark:bg-neutral-800"
              />
            </div>

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
                className="block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20 dark:border-neutral-700 dark:text-gray-100 sm:bg-white sm:shadow-sm sm:dark:bg-neutral-800"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  className="block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20 dark:border-neutral-700 dark:text-gray-100 sm:bg-white sm:shadow-sm sm:dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••••••"
                  className="block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20 dark:border-neutral-700 dark:text-gray-100 sm:bg-white sm:shadow-sm sm:dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="mt-2 w-full"
            >
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-gray-900 dark:text-white underline hover:no-underline"
            >
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
