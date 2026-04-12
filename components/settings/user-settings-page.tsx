"use client";

import { useAutoDismissToast } from "@/hooks/useAutoDismissToast";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { BottomToast } from "@/components/ui/bottom-toast";
import { AccountPreferencesContent } from "@/components/settings/account-preferences-content";
import { useI18n } from "@/components/providers/i18n-provider";

export function UserSettingsPage() {
  const { toastMessage, showToast } = useAutoDismissToast();
  const { t } = useI18n();

  return (
    <DashboardLayout
      showTopbar
      showTopbarSearch={false}
      searchPlaceholder={t("settings.searchInfrastructure")}
    >
      <AccountPreferencesContent onToast={showToast} />
      <BottomToast message={toastMessage} />
    </DashboardLayout>
  );
}
