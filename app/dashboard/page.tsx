"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { FreshnessAlerts } from "@/components/dashboard/freshness-alerts";
import { Overview } from "@/components/dashboard/overview";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ShoppingListCard } from "@/components/dashboard/shopping-list";
import { AddProductFAB } from "@/components/ui/add-product-fab";
import { QuickFilters } from "@/components/dashboard/quick-filters";

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardLayout activeItem="dashboard" showTopbar showTopbarSearch={false}>
        <Overview />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <FreshnessAlerts />
          <ShoppingListCard />
        </section>

        <AddProductFAB />
        <QuickFilters />
      </DashboardLayout>
      
    </ProtectedRoute>
  );
}
