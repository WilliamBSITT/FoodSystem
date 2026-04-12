"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, ChevronUp, House, PlusCircle, Settings, ShoppingCart } from "lucide-react";
import gsap from "gsap";

type DemoInventoryItem = {
  id: number;
  name: string;
  family: string;
  zone: string;
  zoneDetail: string;
  qty: number;
  expiry: string;
  created: string;
};

const demoItems: DemoInventoryItem[] = [
  { id: 1, name: "Breadcrumbs", family: "Pantry", zone: "Kitchen Pantry", zoneDetail: "Baking Shelf", qty: 4, expiry: "25 Apr 26", created: "30 Mar 26" },
  { id: 2, name: "Almonds", family: "Pantry", zone: "Garage Storage", zoneDetail: "Bulk Grains", qty: 3, expiry: "10 Sep 26", created: "8 Apr 26" },
  { id: 3, name: "Almonds (Roasted)", family: "Pantry", zone: "Garage Storage", zoneDetail: "Bulk Grains", qty: 4, expiry: "7 Feb 27", created: "8 Apr 26" },
  { id: 4, name: "Baking Powder", family: "Pantry", zone: "Kitchen Pantry", zoneDetail: "Baking Shelf", qty: 3, expiry: "10 Nov 26", created: "8 Apr 26" },
  { id: 5, name: "Butter", family: "Fresh", zone: "Kitchen Fridge", zoneDetail: "Cheese & Deli", qty: 5, expiry: "10 Feb 27", created: "8 Apr 26" },
  { id: 6, name: "Eggs", family: "Fresh", zone: "Kitchen Fridge", zoneDetail: "Top Tray", qty: 12, expiry: "18 Jan 27", created: "7 Apr 26" },
  { id: 7, name: "Tomato Sauce", family: "Pantry", zone: "Kitchen Pantry", zoneDetail: "Sauce Shelf", qty: 6, expiry: "22 Aug 27", created: "4 Apr 26" },
  { id: 8, name: "Olive Oil", family: "Pantry", zone: "Kitchen Pantry", zoneDetail: "Bottle Rack", qty: 2, expiry: "15 Dec 27", created: "2 Apr 26" },
];

type DemoMobileTab = {
  key: string;
  label: string;
  icon: typeof House;
  active?: boolean;
  isPrimary?: boolean;
};

const demoMobileTabs: DemoMobileTab[] = [
  { key: "home", label: "Home", icon: House },
  { key: "inventory", label: "Inventory", icon: Boxes, active: true },
  { key: "add", label: "Add", icon: PlusCircle, isPrimary: true },
  { key: "list", label: "List", icon: ShoppingCart },
  { key: "profile", label: "Profile", icon: Settings },
];

interface InteractiveInventoryDemoProps {
  deployUrl: string;
}

export function InteractiveInventoryDemo({ deployUrl }: InteractiveInventoryDemoProps) {
  const [showDeployPrompt, setShowDeployPrompt] = useState(false);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const demoRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!demoRootRef.current) return;

    const ctx = gsap.context(() => {
      const q = (sel: string) => (demoRootRef.current ? Array.from(demoRootRef.current.querySelectorAll(sel)) : []);

      const cards = q(".demo-card");
      if (cards.length) {
        gsap.from(cards, {
          opacity: 0,
          y: 18,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.15,
        });
      }

      const bottomNav = q(".demo-bottom-nav");
      if (bottomNav.length) {
        gsap.from(bottomNav, {
          opacity: 0,
          y: 14,
          duration: 0.55,
          ease: "power2.out",
          delay: 0.25,
        });
      }

      const scrollTop = q(".demo-scroll-top");
      if (scrollTop.length) {
        gsap.from(scrollTop, {
          opacity: 0,
          scale: 0.7,
          duration: 0.55,
          ease: "back.out(1.7)",
          delay: 0.35,
        });
      }
    }, demoRootRef);

    return () => ctx.revert();
  }, []);

  function handleDemoNavClick() {
    setShowDeployPrompt(true);
  }

  function scrollPreviewToTop() {
    previewScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div ref={demoRootRef} className="w-full max-w-[402px] rounded-[36px] border-4 border-[#ebf6ff] bg-[#f2f4f9] p-2">
      <div className="relative aspect-[9/19.5] rounded-[30px] border border-[#d8deee] bg-[#eef1f7]">
        <div ref={previewScrollRef} className="h-full overflow-y-auto px-2 pb-28 pt-2">
          {demoItems.map((item) => (
            <article
              key={item.id}
              className="demo-card mb-3 rounded-3xl border border-[#d4dbea] bg-[#f8f9fc] px-4 py-3"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl font-semibold leading-none text-[#121a2a]">{item.name}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#536182]">{item.family}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="inline-block rounded-full bg-[#dce0ea] px-2 py-1 font-semibold text-[#4f5b77]">{item.zone}</span>
                  <p className="mt-1 font-semibold text-[#6a7490]">{item.zoneDetail}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <p className="text-[#68738f]">Stock</p>
                  <p className="text-3xl font-semibold leading-none text-[#101828]">{item.qty}</p>
                </div>
                <div>
                  <p className="text-[#68738f]">Expiring</p>
                  <p className="text-xl font-semibold leading-none text-[#101828]">{item.expiry}</p>
                </div>
                <div>
                  <p className="text-[#68738f]">Created</p>
                  <p className="text-xl font-semibold leading-none text-[#101828]">{item.created}</p>
                </div>
                <div />
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollPreviewToTop}
          className="demo-scroll-top absolute bottom-24 right-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#3345b8] text-white shadow-[0_12px_22px_rgba(51,69,184,0.45)]"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ChevronUp size={20} />
        </button>

        {showDeployPrompt ? (
          <div className="absolute bottom-24 left-1/2 z-20 w-[86%] -translate-x-1/2 rounded-xl border border-[#d5dbea] bg-white px-3 py-2 text-xs text-[#4e5872] shadow-lg">
            <p className="font-semibold text-[#2a3556]">Deploy now to unlock real navigation.</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowDeployPrompt(false)}
                className="rounded-md px-2 py-1 font-semibold text-[#6a7388] hover:bg-[#f3f5fa]"
              >
                Later
              </button>
              <a
                href={deployUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-[#3345b8] px-2.5 py-1 font-semibold text-white"
              >
                Deploy now
              </a>
            </div>
          </div>
        ) : null}

        <nav className="demo-bottom-nav absolute inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-10 mx-auto w-auto rounded-2xl border border-[#d5dbea] bg-[#f7f8fc] px-2 pb-2 pt-2 shadow-[0_12px_30px_rgba(15,22,40,0.18)]">
          <ul className="flex items-end justify-between gap-1">
            {demoMobileTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <li key={tab.key} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={handleDemoNavClick}
                    className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium ${
                      tab.active ? "text-[#3345b8]" : "text-[#6d758b]"
                    }`}
                  >
                    {tab.isPrimary ? (
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3345b8] text-white shadow-[0_8px_16px_rgba(99,102,241,0.35)]">
                        <Icon size={20} />
                      </span>
                    ) : (
                      <Icon size={18} />
                    )}
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
