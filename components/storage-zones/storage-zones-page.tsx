"use client";

import { useAutoDismissToast } from "@/hooks/useAutoDismissToast";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StorageZonesContent } from "./storage-zones-content";
import { CategoriesSettingsContent } from "./categories-settings-content";
import { FamiliesSettingsContent } from "@/components/settings/families-settings-content";
import { BottomToast } from "@/components/ui/bottom-toast";
import { useI18n } from "@/components/providers/i18n-provider";

export function StorageZonesPage() {
  const { toastMessage, showToast } = useAutoDismissToast();
  const { t } = useI18n();

  return (
    <DashboardLayout
      activeItem="settings"
      showTopbar
      showTopbarSearch={false}
      searchPlaceholder={t("settings.searchInfrastructure")}
    >
      <StorageZonesContent onToast={showToast} />
      <CategoriesSettingsContent onToast={showToast} />
      <FamiliesSettingsContent onToast={showToast} />
      <BottomToast message={toastMessage} />
    </DashboardLayout>
  );
}
