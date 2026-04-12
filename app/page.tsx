"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Database, LayoutGrid, Menu, ShoppingCart, Warehouse, X } from "lucide-react";
import { APP_REPOSITORY_URL, APP_VERSION } from "@/lib/constants";
import { InteractiveInventoryDemo } from "@/components/landing/interactive-inventory-demo";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const featureCards = [
  {
    title: "Real-Time Inventory",
    description:
      "Track every ingredient from the store to your plate with live stock updates.",
    icon: Database,
  },
  {
    title: "Smart Expiry Alerts",
    description:
      "Receive proactive notifications before food goes to waste, saving you money and stress.",
    icon: Bell,
  },
  {
    title: "Granular Organization",
    description:
      "Precision sorting by zones, categories, and custom families tailored to your home layout.",
    icon: Warehouse,
  },
  {
    title: "Dynamic Shopping Lists",
    description:
      "Automatically bridge the gap between what you have and what you need for your next meal.",
    icon: ShoppingCart,
  },
  {
    title: "Multi-Zone Logic",
    description:
      "Manage complex storage across multiple fridges, freezers, and pantries with ease.",
    icon: LayoutGrid, 
  },
];

export default function Home() {
  const appVersion = APP_VERSION;
  const deploymentDocsUrl = `${APP_REPOSITORY_URL}/blob/main/Doc/Setup.md`;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      const q = (sel: string) => (pageRef.current ? Array.from(pageRef.current.querySelectorAll(sel)) : []);

      const heroChip = q(".gsap-hero-chip");
      if (heroChip.length) gsap.from(heroChip, { opacity: 0, y: 12, duration: 0.6, ease: "power3.out" });

      const heroTitle = q(".gsap-hero-title");
      if (heroTitle.length) gsap.from(heroTitle, { opacity: 0, y: 22, duration: 0.8, ease: "power3.out", delay: 0.05 });

      const heroCopy = q(".gsap-hero-copy");
      if (heroCopy.length) gsap.from(heroCopy, { opacity: 0, y: 16, duration: 0.8, ease: "power2.out", delay: 0.16 });

      const heroCta = q(".gsap-hero-cta");
      if (heroCta.length) gsap.from(heroCta, { opacity: 0, y: 14, duration: 0.7, ease: "power2.out", delay: 0.24 });

      const demoFrame = q(".gsap-demo-frame");
      if (demoFrame.length) gsap.from(demoFrame, { opacity: 0, x: 24, duration: 0.9, ease: "power3.out", delay: 0.16 });

      const featureCards = q(".gsap-feature-card");
      const featuresTrigger = pageRef.current?.querySelector(".gsap-features");
      if (featureCards.length && featuresTrigger) {
        gsap.from(featureCards, {
          scrollTrigger: { trigger: featuresTrigger, start: "top 80%" },
          opacity: 0,
          y: 22,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
        });
      }

      const deployBox = pageRef.current?.querySelector(".gsap-deploy-box");
      if (deployBox) {
        gsap.from(deployBox, {
          scrollTrigger: { trigger: deployBox, start: "top 82%" },
          opacity: 0,
          y: 22,
          duration: 0.8,
          ease: "power3.out",
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} className="min-h-screen bg-[#f5f5f8] text-[#12141a]">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-5 md:px-6 lg:px-8">
        <header className="rounded-2xl border border-[#e4e8f3] bg-white px-5 py-4 shadow-[0_8px_26px_rgba(15,22,40,0.06)] md:px-7 md:py-5">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <Link href="/" className="text-2xl font-semibold tracking-tight text-[#3345b8] md:text-[30px]">
                FoodSystem
              </Link>
              <a
                href={APP_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#cfd6ea] bg-[#f3f6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f53cb] transition-opacity hover:opacity-80"
              >
                {appVersion}
              </a>
            </div>

            <nav className="hidden items-center gap-8 text-sm font-medium text-[#575f75] md:flex">
              <a href="#features" className="hover:text-[#3345b8]">
                Features
              </a>
              <a href="#solutions" className="hover:text-[#3345b8]">
                Solutions
              </a>
              <a href="#deploy" className="hover:text-[#3345b8]">
                Deploy
              </a>
            </nav>

            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="rounded-full p-2 text-[#4f5462] hover:bg-[#eceef5] md:hidden"
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="hidden items-center gap-3 md:flex">
              <Link 
                href="/login?mode=register" 
                className="text-sm font-medium text-[#575d6d] hover:text-[#3345b8]"
              >
                Get Started
              </Link>

              <Link
                href="/login?mode=login"
                className="rounded-full bg-[#3345b8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(51,69,184,0.35)] transition-opacity hover:opacity-90"
              >
                Log In
              </Link>
            </div>
          </div>

          {mobileNavOpen ? (
            <nav className="mt-4 space-y-4 border-t border-[#e4e8f3] pt-4 text-sm font-medium text-[#575f75] md:hidden">
              <div className="flex flex-col gap-3">
              <a href="#features" className="hover:text-[#3345b8]" onClick={() => setMobileNavOpen(false)}>
                Features
              </a>
              <a href="#solutions" className="hover:text-[#3345b8]" onClick={() => setMobileNavOpen(false)}>
                Solutions
              </a>
              <a href="#deploy" className="hover:text-[#3345b8]" onClick={() => setMobileNavOpen(false)}>
                deploy
              </a>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-[#edf0f7] pt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-[#d8deef] px-4 py-2.5 text-sm font-semibold text-[#4f5462]"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-[#3345b8] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          ) : null}
        </header>

        <section className="mt-10 grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="gsap-hero-chip inline-flex rounded-full bg-[#e7eafb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4254c8]">
              Inventory Intelligence
            </p>
            <h1 className="gsap-hero-title mt-5 max-w-[520px] text-5xl font-semibold leading-[1.04] text-[#11131a] md:text-6xl">
              Awaken your home
            </h1>
            <p className="gsap-hero-copy mt-5 max-w-[520px] text-base leading-7 text-[#676d7d]">
              Master your kitchen with an open-source inventory handler that puts you in charge. By combining a professional-grade workspace with transparent data ownership via Supabase, FoodSystem helps you eliminate waste with surgical precision.
            </p>
          </div>

          <div className="gsap-demo-frame">
            <InteractiveInventoryDemo deployUrl={APP_REPOSITORY_URL} />
          </div>
        </section>
      </div>

      <section id="features" className="gsap-features py-16">
        <div className="mx-auto w-full max-w-[1120px] px-4 md:px-6 lg:px-8">
          <h2 className="mx-auto max-w-[620px] text-center text-5xl font-semibold leading-tight text-[#12151c]">
            Smart Features for High-End Operations
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-center text-sm leading-6 text-[#686f81]">
            Everything you need to eliminate waste and maintain the highest quality standards.
          </p>

          <div className="mt-11 flex flex-wrap justify-center gap-8">
            {featureCards.map((feature) => (
              <article 
                key={feature.title} 
                className="gsap-feature-card w-full md:w-[calc(33.333%-2rem)] min-w-[300px] rounded-2xl p-2"
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eaf4] text-[#3345b8]">
                  <feature.icon size={18} />
                </div>
                <h3 className="text-2xl font-semibold text-[#141821]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#666d7f]">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="deploy" className="pb-14">
        <div className="mx-auto w-full max-w-[1120px] px-4 md:px-6 lg:px-8">
          <div className="gsap-deploy-box rounded-[28px] bg-[linear-gradient(130deg,#3345b8_0%,#4964d6_100%)] px-8 py-14 text-center text-white shadow-[0_20px_40px_rgba(50,70,190,0.35)]">
            <h2 className="text-5xl font-semibold">Ready to transform your inventory?</h2>
            <p className="mx-auto mt-4 max-w-[680px] text-sm leading-7 text-white/90">
              Your kitchen, organized. Effortless inventory tracking designed for the modern home.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={APP_REPOSITORY_URL}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-3 text-sm font-semibold text-white"
              >
                Setup Now <ArrowRight size={16} />
              </Link>
              <a
                href={deploymentDocsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#3345b8]"
              >
                Deployment Guide
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e6e8ef] bg-[#f5f5f8] py-8">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 text-xs text-[#737a8b] md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div>
            <p className="font-semibold text-[#3345b8]">FoodSystem</p>
            <p className="mt-1">Elevating the standards of inventory management.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#3345b8]">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-[#3345b8]">
              Terms of Service
            </Link>
            <Link href="/contact-us" className="hover:text-[#3345b8]">
              Contact Us
            </Link>
          </div>
          <p>© 2026 FoodSystem. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
