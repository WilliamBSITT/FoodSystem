import { UserSettingsPage } from "@/components/settings/user-settings-page";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <UserSettingsPage />
    </ProtectedRoute>
  );
}
