"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

interface AddProductFABProps {
  href?: string;
}

export function AddProductFAB({ href = "/add-product" }: AddProductFABProps) {
  const { t } = useI18n();

  return (
    <Link
      href={href}
      className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#3345b8] text-white shadow-lg transition-transform hover:scale-105 lg:bottom-7 lg:right-7"
      aria-label={t("fab.addProduct")}
    >
      <Plus size={22} />
    </Link>
  );
}
