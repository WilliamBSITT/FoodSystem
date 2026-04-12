"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-service";

type RawMetadata = {
  full_name?: string;
  role?: string;
  avatar_url?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function mapUserToProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: RawMetadata | null;
}): UserProfile {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? "",
    name: metadata.full_name?.trim() || "User",
    role: metadata.role?.trim() || "Member",
  };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    const { data, error: userError } = await getCurrentUser();

    if (userError) {
      setError(userError.message);
      setLoading(false);
      return null;
    }

    if (!data.user) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    const mapped = mapUserToProfile(data.user);
    setProfile(mapped);
    setLoading(false);
    return mapped;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const updateProfile = useCallback(
    async (updates: { name: string; role: string }) => {
      setSaving(true);
      setError(null);

      const { data, error: userError } = await getCurrentUser();

      if (userError || !data.user) {
        setSaving(false);
        throw new Error(userError?.message ?? "Unable to load current user.");
      }

      const currentMetadata = (data.user.user_metadata ?? {}) as RawMetadata;

      const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          full_name: updates.name.trim(),
          role: updates.role.trim(),
        },
      });

      if (updateError) {
        setSaving(false);
        throw new Error(updateError.message);
      }

      const nextUser = updatedData.user ?? data.user;
      const nextProfile = mapUserToProfile(nextUser);
      setProfile(nextProfile);
      setSaving(false);
      return nextProfile;
    },
    [],
  );

  return {
    profile,
    loading,
    saving,
    error,
    refresh,
    updateProfile,
  };
}
