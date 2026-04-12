"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MIN_PASSWORD_LENGTH, isPasswordComplex } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth-service";

export function useAccountPreferences() {
  const router = useRouter();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Profile update state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function onChangePassword(event: FormEvent<HTMLFormElement>, onToast?: (msg: string) => void) {
    event.preventDefault();
    setPasswordError(null);

    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }

    const trimmedPassword = newPassword.trim();

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    // SECURITY FIX: enforce strong password complexity for password updates too
    if (!isPasswordComplex(trimmedPassword)) {
      setPasswordError("Password must include an uppercase letter, a number, and a special character.");
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (trimmedPassword === currentPassword.trim()) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    setIsSavingPassword(true);

    const { data: userData, error: userError } = await getCurrentUser();

    if (userError || !userData.user?.email) {
      setIsSavingPassword(false);
      setPasswordError("Unable to verify current user.");
      return;
    }

    const { error: currentPasswordError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword.trim(),
    });

    if (currentPasswordError) {
      setIsSavingPassword(false);
      setPasswordError("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: trimmedPassword,
    });

    setIsSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onToast?.("Password updated.");
  }

  async function onDeleteAccount() {
    setDeleteError(null);
    setIsDeletingAccount(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setIsDeletingAccount(false);
      setDeleteError("Session expired. Please log in again.");
      return;
    }

    const response = await fetch("/api/account/delete", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setIsDeletingAccount(false);
      setDeleteError(payload.error ?? "Unable to delete account.");
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  function onSaveProfile(
    event: FormEvent<HTMLFormElement>,
    updateProfile: (data: { name: string; role: string }) => Promise<unknown>,
    profileName: string,
    profileRole: string,
    onToast?: (msg: string) => void,
  ) {
    event.preventDefault();
    setProfileError(null);

    const trimmedName = profileName.trim();
    const trimmedRole = profileRole.trim();

    if (!trimmedName) {
      setProfileError("Name is required.");
      return;
    }

    if (!trimmedRole) {
      setProfileError("Role is required.");
      return;
    }

    void (async () => {
      try {
        await updateProfile({
          name: trimmedName,
          role: trimmedRole,
        });
        setIsEditingProfile(false);
        onToast?.("Profile updated.");
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : "Unable to update profile.");
      }
    })();
  }

  return {
    // Password change
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    isSavingPassword,
    onChangePassword,

    // Account deletion
    showDeleteDialog,
    setShowDeleteDialog,
    isDeletingAccount,
    deleteError,
    onDeleteAccount,

    // Profile editing
    isEditingProfile,
    setIsEditingProfile,
    profileError,
    setProfileError,
    onSaveProfile,
  };
}
