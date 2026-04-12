"use client";

import { useEffect, useState } from "react";
import { MonitorCog, Moon, Palette, Pencil, Shield, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useInventoryViewMode, type InventoryViewMode } from "@/hooks/useInventoryViewMode";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAccountPreferences } from "@/hooks/useAccountPreferences";
import { getCurrentUser } from "@/lib/auth-service";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/components/providers/i18n-provider";
import { useTheme } from "@/components/providers/theme-provider";

interface AccountPreferencesContentProps {
  onToast?: (message: string) => void;
}

type UserPreferenceMetadata = {
  pref_email_alerts?: boolean;
  pref_push_alerts?: boolean;
  pref_weekly_reports?: boolean;
  pref_theme?: "light" | "dark" | "system";
  pref_language?: "en" | "fr";
};

export function AccountPreferencesContent({ onToast }: AccountPreferencesContentProps) {
  const { t, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { viewMode, setViewMode } = useInventoryViewMode();
  const { profile, loading: profileLoading, saving: profileSaving, updateProfile } = useUserProfile();
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    isSavingPassword,
    onChangePassword,
    showDeleteDialog,
    setShowDeleteDialog,
    isDeletingAccount,
    deleteError,
    onDeleteAccount,
    isEditingProfile,
    setIsEditingProfile,
    profileError,
    setProfileError,
    onSaveProfile,
  } = useAccountPreferences();

  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(true);
  const [weeklyReportsEnabled, setWeeklyReportsEnabled] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "fr">("en");
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");

  const displayProfileName = profile?.name ?? t("nav.user");
  const displayProfileRole = profile?.role ?? t("preferences.member");

  useEffect(() => {
    let isMounted = true;

    async function loadUserPreferences() {
      const { data, error } = await getCurrentUser();

      if (error || !data.user || !isMounted) {
        return;
      }

      const metadata = (data.user.user_metadata ?? {}) as UserPreferenceMetadata;

      setEmailAlertsEnabled(metadata.pref_email_alerts ?? true);
      setPushAlertsEnabled(metadata.pref_push_alerts ?? true);
      setWeeklyReportsEnabled(metadata.pref_weekly_reports ?? false);
      setPreferredLanguage(metadata.pref_language ?? "en");
    }

    void loadUserPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveUserPreferences(patch: Partial<UserPreferenceMetadata>, successMessage?: string) {
    const { data, error } = await getCurrentUser();

    if (error || !data.user) {
      console.error("Unable to resolve user for preference update:", error);
      onToast?.(t("preferences.unableSave"));
      return;
    }

    const currentMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        ...patch,
      },
    });

    if (updateError) {
      console.error("Failed to save user preferences:", updateError);
      onToast?.(t("preferences.unableSave"));
      return;
    }

    if (successMessage) {
      onToast?.(successMessage);
    }
  }

  function onChangeInventoryMode(mode: InventoryViewMode) {
    setViewMode(mode);
    onToast?.(
      mode === "grouped"
        ? t("preferences.inventoryGroupedToast")
        : t("preferences.inventoryClassicToast"),
    );
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[34px] font-semibold leading-tight text-[var(--foreground)]">{t("preferences.title")}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          <Card className="bg-[var(--surface)]">
            <CardContent className="p-6">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setProfileError(null);
                    setIsEditingProfile((current) => {
                      const next = !current;

                      if (!current && profile) {
                        setProfileName(profile.name);
                        setProfileRole(profile.role);
                      }

                      return next;
                    });
                  }}
                  className="rounded-full p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
                  aria-label={t("preferences.editProfile")}
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className="text-center">
                <Avatar
                  label={(profileName.trim().charAt(0) || profile?.name?.trim().charAt(0) || "U").toUpperCase()}
                  className="mx-auto h-32 w-32 border-4 border-[var(--border)] bg-[var(--surface-muted)] text-5xl text-[var(--foreground)] shadow-sm"
                />
              </div>

              {isEditingProfile ? (
                <form className="mt-4" onSubmit={(event) => void onSaveProfile(event, updateProfile, profileName, profileRole, onToast)}>
                  <Input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder={t("preferences.displayName")}
                    required
                    className="mt-2 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-left text-2xl font-medium text-[var(--primary)] border-0 focus:ring-0"
                  />

                  <p className="mt-1 text-xl text-[var(--muted)] text-center">
                    {profileLoading ? t("common.loading") : profile?.email ?? ""}
                  </p>

                  <p className="ml-3 mt-6 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {t("preferences.role")}
                  </p>
                  <Input
                    value={profileRole}
                    onChange={(event) => setProfileRole(event.target.value)}
                    placeholder={t("preferences.role")}
                    required
                    className="mt-2 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-left text-2xl font-medium text-[var(--primary)] border-0 focus:ring-0"
                  />

                  {profileError ? <p className="text-xs font-semibold text-[var(--danger)]">{profileError}</p> : null}

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      type="submit"
                      disabled={profileSaving}
                      className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2 text-[11px] tracking-[0.08em] text-[var(--background)] disabled:opacity-60"
                    >
                      {profileSaving ? t("preferences.saving") : t("common.save")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (profile) {
                          setProfileName(profile.name);
                          setProfileRole(profile.role);
                        }
                        setProfileError(null);
                        setIsEditingProfile(false);
                      }}
                      className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-[11px] tracking-[0.08em] text-[var(--muted-strong)]"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="mt-5 text-4xl font-semibold tracking-tight text-[var(--foreground)] text-center">{displayProfileName}</p>
                  <p className="mt-1 text-xl text-[var(--muted)] text-center">
                    {profileLoading ? t("common.loading") : profile?.email ?? ""}
                  </p>

                  <p className="ml-3 mt-6 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {t("preferences.role")}
                  </p>
                  <div className="mt-2 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-left text-2xl font-medium text-[var(--primary)]">
                    {displayProfileRole}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-[var(--primary)] text-[var(--background)]">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--background)]/70">{t("preferences.displayMode")}</p>
              <p className="mt-2 text-2xl font-semibold">{t("preferences.inventoryView")}</p>
              <p className="mt-2 text-sm text-[var(--background)]/80">{t("preferences.chooseInventoryView")}</p>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => onChangeInventoryMode("classic")}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    viewMode === "classic"
                      ? "border-[var(--background)] bg-[var(--background)] text-[var(--primary)]"
                      : "border-[var(--background)]/40 bg-[var(--background)]/10 text-[var(--background)]"
                  }`}
                >
                  {t("preferences.classic")}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeInventoryMode("grouped")}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    viewMode === "grouped"
                      ? "border-white bg-white text-[#3345b8]"
                      : "border-white/40 bg-white/10 text-white"
                  }`}
                >
                  {t("preferences.groupedByCategory")}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card className="bg-[var(--surface)]">
            <CardContent className="p-5">
              <p className="mb-4 text-2xl font-semibold text-[var(--foreground)]">{t("preferences.notificationSettings")}</p>
              <div className="space-y-4">
                <SwitchRow
                  label={t("preferences.emailAlerts")}
                  description={t("preferences.emailAlertsDesc")}
                  checked={emailAlertsEnabled}
                  onToggle={(nextValue) => {
                    setEmailAlertsEnabled(nextValue);
                    void saveUserPreferences({ pref_email_alerts: nextValue }, t("preferences.emailAlertsSaved"));
                  }}
                />
                <SwitchRow
                  label={t("preferences.pushNotifications")}
                  description={t("preferences.pushNotificationsDesc")}
                  checked={pushAlertsEnabled}
                  onToggle={(nextValue) => {
                    setPushAlertsEnabled(nextValue);
                    void saveUserPreferences({ pref_push_alerts: nextValue }, t("preferences.pushNotificationsSaved"));
                  }}
                />
                <SwitchRow
                  label={t("preferences.weeklyReports")}
                  description={t("preferences.weeklyReportsDesc")}
                  checked={weeklyReportsEnabled}
                  onToggle={(nextValue) => {
                    setWeeklyReportsEnabled(nextValue);
                    void saveUserPreferences({ pref_weekly_reports: nextValue }, t("preferences.weeklyReportsSaved"));
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--surface)]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Palette size={16} className="text-[var(--primary)]" />
                <p className="text-2xl font-semibold text-[var(--foreground)]">{t("preferences.displayPreferences")}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:items-end">
                <div>
                  <p className="mb-2 text-sm text-[var(--muted)]">{t("preferences.interfaceTheme")}</p>
                  <div className="flex gap-2">
                    {([
                      { key: "light", label: t("preferences.light"), icon: Sun },
                      { key: "dark", label: t("preferences.dark"), icon: Moon },
                      { key: "system", label: t("preferences.system"), icon: MonitorCog },
                    ] as const).map((themeOption) => {
                      const Icon = themeOption.icon;
                      const selected = theme === themeOption.key;

                      return (
                        <button
                          key={themeOption.key}
                          type="button"
                          onClick={() => {
                            setTheme(themeOption.key);
                            void saveUserPreferences({ pref_theme: themeOption.key }, t("preferences.themeSaved"));
                          }}
                          className={`rounded-xl border min-w-[72px] px-2 py-2 text-[11px] font-semibold ${
                            selected
                              ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                              : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]"
                          }`}
                        >
                          <Icon size={12} className="mx-auto mb-1" />
                          {themeOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-[var(--muted)]">{t("preferences.preferredLanguage")}</p>
                  <select
                    value={preferredLanguage}
                    onChange={(event) => {
                      const nextLanguage = event.target.value === "fr" ? "fr" : "en";
                      setPreferredLanguage(nextLanguage);
                      setLanguage(nextLanguage);
                      void saveUserPreferences(
                        { pref_language: nextLanguage },
                        nextLanguage === "fr" ? t("preferences.languageFrenchSet") : t("preferences.languageEnglishSet"),
                      );
                    }}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="en">{t("preferences.english")}</option>
                    <option value="fr">{t("preferences.french")}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--surface)]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield size={16} className="text-[var(--primary)]" />
                <p className="text-2xl font-semibold text-[var(--foreground)]">{t("preferences.accountSecurity")}</p>
              </div>

              <form className="space-y-3" onSubmit={(event) => void onChangePassword(event, onToast)}>
                <div className="grid grid-cols-1 gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:grid-cols-3">
                  <p>{t("preferences.currentPassword")}</p>
                  <p>{t("preferences.newPassword")}</p>
                  <p>{t("preferences.confirmNew")}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="********"
                    required
                  />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder={t("preferences.newPassword")}
                    required
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("preferences.confirmNew")}
                    required
                  />
                </div>

                {passwordError ? <p className="text-xs font-semibold text-[var(--danger)]">{passwordError}</p> : null}

                <Button
                  type="submit"
                  disabled={isSavingPassword}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-[11px] tracking-[0.08em] text-[var(--background)] disabled:opacity-60"
                >
                  {isSavingPassword ? t("preferences.saving") : t("preferences.updatePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4 border border-[var(--border)] bg-[var(--surface)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-lg font-semibold text-[var(--danger)]">{t("preferences.dangerZone")}</p>
            <p className="text-sm text-[var(--muted)]">{t("preferences.dangerDesc")}</p>
            {deleteError ? <p className="mt-1 text-xs font-semibold text-[var(--danger)]">{deleteError}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-full border border-[var(--danger)] px-5 py-2 text-sm font-semibold text-[var(--danger)]"
          >
            {t("preferences.deleteMyAccount")}
          </button>
        </CardContent>
      </Card>

      {showDeleteDialog ? (
        <ConfirmationDialog
          title={t("preferences.deleteAccount")}
          description={t("preferences.deleteConfirm")}
          confirmLabel={isDeletingAccount ? t("preferences.saving") : t("preferences.yesDelete")}
          cancelLabel={t("common.cancel")}
          onCancel={() => {
            if (!isDeletingAccount) {
              setShowDeleteDialog(false);
            }
          }}
          onConfirm={() => {
            if (!isDeletingAccount) {
              void onDeleteAccount();
            }
          }}
        />
      ) : null}
    </section>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-[var(--foreground)]">{label}</p>
        <p className="text-sm text-[var(--muted)]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-[var(--primary)]" : "bg-[var(--surface-strong)]"}`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--background)] transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}
