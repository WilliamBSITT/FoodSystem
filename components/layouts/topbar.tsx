"use client";

import { Menu, Search, UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";

interface TopbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  onMenuClick?: () => void;
}

export function Topbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = true,
  onMenuClick,
}: TopbarProps) {
  const { t } = useI18n();

  return (
    <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_8px_18px_rgba(15,22,40,0.06)] lg:mb-7 lg:flex-row lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
    {/* <header className="-mx-5 sticky top-0 z-20 mb-6 flex rounded-2xl flex-col gap-3 border-b border-[#e3e6f0] bg-[#f7f7fa]/95 px-5 pb-3 pt-2 backdrop-blur-sm lg:static lg:mx-0 lg:mb-7 lg:flex-row lg:items-center lg:gap-3 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:backdrop-blur-none"> */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-strong)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] lg:hidden"
          aria-label={t("nav.openNavigation")}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white">
            <UtensilsCrossed size={13} />
          </span>
          <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">FoodSystem</p>
        </div>
      </div>

      {showSearch ? (
        <Input
          className="h-11 w-full rounded-full border-[var(--border)] bg-[var(--surface)] shadow-sm lg:h-10 lg:max-w-[430px] lg:flex-1 lg:w-[430px] lg:flex-none lg:rounded-xl lg:border-[var(--border)] lg:bg-[var(--surface-muted)] lg:shadow-none"
          placeholder={searchPlaceholder ?? t("topbar.searchCulinaryInventory")}
          value={searchValue}
          onChange={onSearchChange ? (event) => onSearchChange(event.target.value) : undefined}
          startIcon={<Search size={14} className="text-[#7f8392]" />}
          clearable
          onClear={onSearchChange ? () => onSearchChange("") : undefined}
          clearAriaLabel={t("common.clear")}
        />
      ) : null}
    </header>
  );
}
