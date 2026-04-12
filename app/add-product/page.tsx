import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AddProductContent } from "@/components/add-product/add-product-content";

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardLayout activeItem="add-product" showTopbar showTopbarSearch={false}>
        <AddProductContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
