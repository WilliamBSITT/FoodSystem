"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AccountPreferencesContent } from "@/components/settings/account-preferences-content";
import { useAutoDismissToast } from "@/hooks/useAutoDismissToast";
import { BottomToast } from "@/components/ui/bottom-toast";

export default function Page() {
  const { toastMessage, showToast } = useAutoDismissToast();

  return (
    <ProtectedRoute>
      <DashboardLayout activeItem="settings" showTopbar={false}>
        <AccountPreferencesContent onToast={showToast} />
        <BottomToast message={toastMessage} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
