import { StorageZonesPage } from "@/components/storage-zones/storage-zones-page";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Page() {
  return (
    <ProtectedRoute>
      <StorageZonesPage />
    </ProtectedRoute>
  );
}
