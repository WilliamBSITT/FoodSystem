import { supabase } from "@/lib/supabase";

export interface AuthError {
  message: string;
}

type CurrentUserResult = Awaited<ReturnType<typeof supabase.auth.getUser>>;

let currentUserPromise: Promise<CurrentUserResult> | null = null;

export function getCurrentUser() {
  if (!currentUserPromise) {
    currentUserPromise = supabase.auth.getUser().finally(() => {
      currentUserPromise = null;
    });
  }

  return currentUserPromise;
}

export async function loginUser(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message ?? "Invalid credentials.");
  }
}

export async function registerUser(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message ?? "Operation failed.");
  }
}
