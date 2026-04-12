import { Suspense } from "react";
import { InventoryPageClient } from "./inventory-page-client";

function InventoryPageFallback() {
  return null;
}

export default function Page() {
  return (
    <Suspense fallback={<InventoryPageFallback />}>
      <InventoryPageClient />
    </Suspense>
  );
}
