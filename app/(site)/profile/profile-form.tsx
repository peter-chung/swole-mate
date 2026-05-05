"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { type User } from "@supabase/supabase-js";
import { Eye, EyeOff, LogOut } from "lucide-react";
import Button from "@/app/_components/Button";

export default function ProfileForm({ user }: { user: User | null }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user?.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setFullName(data.full_name ?? "");
        setUsername(data.username ?? "");
      }
    } catch {
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile() {
    try {
      setSaving(true);
      const { error } = await supabase.from("profiles").upsert({
        id: user?.id as string,
        full_name: fullName,
        username,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Profile updated!");
    } catch {
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setPasswordLoading(true);

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user?.email as string,
        password: currentPassword,
      });
      if (reAuthError) {
        toast.error("Current password is incorrect");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toast.success("Password updated!");
    } catch {
      toast.error("Error updating password");
    } finally {
      setPasswordLoading(false);
    }
  }

  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-200";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Profile
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Manage your account details
      </p>

      {/* Profile info */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Profile information
        </h2>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="johndoe"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fullName" className={labelClass}>
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              placeholder="John Doe"
              className={inputClass}
            />
          </div>

        </div>

        <Button
          onClick={updateProfile}
          variant="primary"
          isLoading={saving}
          disabled={loading}
          className="mt-5 w-full sm:w-auto"
        >
          Save changes
        </Button>
      </div>

      {/* Security */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Security
        </h2>

        <form onSubmit={updatePassword} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className={labelClass}>
              Current password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className={labelClass}>
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              At least 8 characters
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={passwordLoading}
            disabled={!currentPassword || !password}
            className="w-full sm:w-auto"
          >
            Update password
          </Button>
        </form>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Sign out
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sign out of your account on this device.
        </p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 active:translate-y-px focus:outline-none cursor-pointer sm:w-auto sm:justify-start dark:border-red-900 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </form>
      </div>

    </div>
  );
}
