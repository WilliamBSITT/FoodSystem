"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Boxes, House, LogOut, PlusCircle, Settings, ShoppingCart, UtensilsCrossed, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { type MenuItemKey } from "@/components/dashboard/data";
import { Avatar } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/components/providers/i18n-provider";

interface AppShellProps {
	children: ReactNode;
	activeItem: MenuItemKey;
	showTopbar?: boolean;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	showTopbarSearch?: boolean;
	searchPlaceholder?: string;
}

export function AppShell({
	children,
	activeItem,
	showTopbar = false,
	searchValue,
	onSearchChange,
	showTopbarSearch = true,
	searchPlaceholder,
}: AppShellProps) {
	const router = useRouter();
	const { profile } = useUserProfile();
	const { t } = useI18n();
	const [mobileProfileMenuOpen, setMobileProfileMenuOpen] = useState(false);
	const mobileProfileMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(event.target as Node)) {
				setMobileProfileMenuOpen(false);
			}
		}

		if (mobileProfileMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [mobileProfileMenuOpen]);

	async function handleLogout() {
		await supabase.auth.signOut();
		setMobileProfileMenuOpen(false);
		router.push("/");
	}

	const mobileTabs = [
		{ key: "dashboard" as const, href: "/dashboard", label: t("appshell.home"), icon: House },
		{ key: "inventory" as const, href: "/inventory", label: t("nav.inventory"), icon: Boxes },
		{ key: "add-product" as const, href: "/add-product", label: t("appshell.add"), icon: PlusCircle },
		{ key: "shopping-list" as const, href: "/shopping-list", label: t("appshell.list"), icon: ShoppingCart },
		{ key: "settings" as const, href: "/settings", label: t("appshell.profile"), icon: Settings },
	];

	return (
		<div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
			<div className="min-h-screen w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
				<Sidebar activeItem={activeItem} />

				<main className="relative p-5 pb-32 md:p-7 lg:ml-[250px] lg:pb-7">
					<header className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_6px_16px_rgba(15,22,40,0.05)] lg:hidden">
						<div className="flex items-center gap-2">
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white">
								<UtensilsCrossed size={13} />
							</span>
							<p className="text-base font-semibold tracking-tight text-[var(--foreground)]">FoodSystem</p>
						</div>
						<div ref={mobileProfileMenuRef} className="relative flex items-center gap-1.5">
							<button
								type="button"
								className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]"
								aria-label={t("appshell.notifications")}
							>
								<Bell size={17} />
							</button>

							<button
								type="button"
								onClick={() => setMobileProfileMenuOpen((current) => !current)}
								className="rounded-full p-0.5 hover:bg-[var(--surface-muted)]"
								aria-label={t("appshell.openProfileMenu")}
							>
								<Avatar
									label={(profile?.name?.trim()?.charAt(0) || "U").toUpperCase()}
									className="h-8 w-8 bg-[var(--primary-soft)] text-[var(--foreground)]"
								/>
							</button>

							{mobileProfileMenuOpen ? (
								<div className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
									<Link
										href="/settings/preferences"
										onClick={() => setMobileProfileMenuOpen(false)}
										className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
									>
										<Settings size={14} />
										{t("appshell.preferences")}
									</Link>
									<button
										type="button"
										onClick={() => void handleLogout()}
										className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
									>
										<LogOut size={14} />
										{t("nav.logOut")}
									</button>
								</div>
							) : null}
						</div>
					</header>
					{showTopbar ? (
						<div className="hidden lg:block">
							<Topbar
								searchPlaceholder={searchPlaceholder}
								searchValue={searchValue}
								onSearchChange={onSearchChange}
								showSearch={activeItem === "add-product" ? false : showTopbarSearch}
							/>
						</div>
					) : null}

					{/* Mobile search for shopping list */}
					{activeItem === "shopping-list" ? (
						<div className="mb-4 lg:hidden">
							<Input
								className="h-11 w-full rounded-full"
								placeholder={t("topbar.searchCulinaryInventory")}
								value={searchValue}
								onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
								startIcon={<Search size={14} className="text-[#7f8392]" />}
								clearable
								onClear={onSearchChange ? () => onSearchChange("") : undefined}
								clearAriaLabel={t("common.clear")}
							/>
						</div>
					) : null}
					{children}
				</main>

					<nav className="fixed inset-x-2 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] mx-auto w-auto max-w-[640px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2 pb-2 pt-2 shadow-[0_12px_30px_rgba(15,22,40,0.18)] lg:hidden">
					<ul className="flex items-end justify-between gap-1">
						{mobileTabs.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeItem === tab.key;

							return (
								<li key={tab.key} className="min-w-0 flex-1">
									<Link
										href={tab.href}
										className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium ${
											isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"
										}`}
									>
										{tab.key === "add-product" ? (
											<span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_8px_16px_rgba(99,102,241,0.35)]">
												<Icon size={20} />
											</span>
										) : (
											<Icon size={18} />
										)}
										<span>{tab.label}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		</div>
	);
}
