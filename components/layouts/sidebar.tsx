"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Boxes, SquarePlus, Settings, ShoppingCart, UtensilsCrossed, X, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { menuItems, type MenuItemKey } from "@/components/dashboard/data";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { APP_REPOSITORY_URL, APP_VERSION } from "@/lib/constants";
import { useI18n } from "@/components/providers/i18n-provider";

const iconMap = {
  dashboard: LayoutDashboard,
  inventory: Boxes,
  add: SquarePlus,
  settings: Settings,
  "shopping-list": ShoppingCart,
};

interface SidebarProps {
  activeItem: MenuItemKey;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface SidebarContentProps {
  activeItem: MenuItemKey;
  onCloseMobile?: () => void;
}

function SidebarContent({
  activeItem,
  onCloseMobile,
}: SidebarContentProps) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
            <Avatar label={<UtensilsCrossed size={14} />} className="h-8 w-8 bg-[var(--primary)] text-white" />
          <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">FoodSystem</p>
              <p className="text-xs text-[var(--muted)]">{t("brand.inventoryManagement")}</p>
          </div>
        </div>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-full p-2 text-[var(--muted-strong)] hover:bg-[var(--surface-muted)] lg:hidden"
            aria-label={t("nav.closeNavigation")}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

        <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = item.key === activeItem;

          return (
            <Link
              href={item.href}
              key={item.key}
              onClick={onCloseMobile}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted-strong)]",
                isActive ? "bg-[var(--surface)] text-[var(--primary)]" : "hover:bg-[var(--surface-muted)]",
              )}
            >
              <Icon size={14} />
              <span>{t(`nav.${item.key}` as "nav.dashboard")}</span>
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div ref={menuRef} className="relative mt-auto">
          {menuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            <Link
                href="/settings/preferences"
              onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              <Settings size={14} />
              {t("nav.userPreferences")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
            >
              <LogOut size={14} />
              {t("nav.logOut")}
            </button>
          </div>
        )}
          <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[var(--surface-muted)]"
        >
          <Avatar
            label={(profile?.name?.trim()?.charAt(0) || "U").toUpperCase()}
              className="h-8 w-8 bg-[var(--primary-soft)] text-[var(--foreground)]"
          />
          <div className="text-left">
              <p className="text-sm font-semibold text-[var(--foreground)]">{profile?.name ?? t("nav.user")}</p>
              <p className="text-xs text-[var(--muted)]">{profile?.role ?? ""}</p>
          </div>
        </button>
          <a
            href={APP_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block px-3 text-xs text-[var(--muted)] hover:text-[var(--primary)]"
          >
            {t("nav.version")} {APP_VERSION}
          </a>
      </div>
    </div>
  );
}

export function Sidebar({
  activeItem,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
        <aside className="hidden w-[250px] border-r border-[var(--border)] bg-[var(--surface-elevated)] p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:h-screen lg:w-[250px] lg:flex-col">
        <SidebarContent
          activeItem={activeItem}
        />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      >
        <aside
          className={cn(
              "absolute left-0 top-0 flex h-full w-[260px] flex-col border-r border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <SidebarContent
            activeItem={activeItem}
            onCloseMobile={onCloseMobile}
          />
        </aside>
      </div>
    </>
  );
}
