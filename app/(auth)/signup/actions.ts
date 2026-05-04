"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .ilike("username", username)
    .maybeSingle();

  if (existing) {
    return { error: "Username is already taken" };
  }

  // Check for an existing anonymous session to upgrade
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser?.is_anonymous) {
    const { error: updateError } = await supabase.auth.updateUser({
      email,
      password,
      data: { username },
    });

    if (updateError) return { error: updateError.message };

    await supabase.from("profiles").upsert({
      id: existingUser.id,
      username,
      updated_at: new Date().toISOString(),
    });

    revalidatePath("/", "layout");
    redirect("/login?notice=confirm-email");
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (signUpData.user?.identities?.length === 0) {
    return { error: "An account with this email already exists" };
  }

  if (signUpData.user && signUpData.session) {
    // Email confirmation disabled — user is logged in immediately
    await supabase.from("profiles").upsert({
      id: signUpData.user.id,
      username,
      updated_at: new Date().toISOString(),
    });
    revalidatePath("/", "layout");
    redirect("/workouts");
  }

  redirect("/login?notice=confirm-email");
}
