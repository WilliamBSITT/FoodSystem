'use client';

import { ReactNode } from "react";
import { AppShell } from "@/components/layouts/app-shell";
import { type MenuItemKey } from "./data";

interface DashboardLayoutProps {
  children: ReactNode;
  activeItem?: MenuItemKey;
  showTopbar?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showTopbarSearch?: boolean;
  searchPlaceholder?: string;
}

export function DashboardLayout({
  children,
  activeItem = "dashboard",
  showTopbar = false,
  searchValue,
  onSearchChange,
  showTopbarSearch = true,
  searchPlaceholder = "Search...",
}: DashboardLayoutProps) {
  return (
    <AppShell
      activeItem={activeItem}
      showTopbar={showTopbar}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      showTopbarSearch={showTopbarSearch}
      searchPlaceholder={searchPlaceholder}
    >
      {children}
    </AppShell>
  );
}
