"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser } from "@/lib/auth-service";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { MIN_PASSWORD_LENGTH, isPasswordComplex } from "@/lib/constants";

type AuthMode = "login" | "register";

function getSafeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNextPath = getSafeNextPath(searchParams.get("next"));
  
  const initialMode = (() => {
    const m = searchParams.get("mode") as AuthMode | null;
    return m === "register" || m === "login" ? m : "login";
  })();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mode is derived from URL on initial render via `initialMode`.

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (mode === "register") {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }

      if (!isPasswordComplex(password)) {
        setError("Password must include an uppercase letter, a number, and a special character.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await loginUser(trimmedEmail, password);
        setLoading(false);
        router.push(safeNextPath);
        return;
      }

      await registerUser(trimmedEmail, password);
      setLoading(false);
      setSuccess("Account created. Please check your email to confirm your registration.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setLoading(false);
      const userMessage = getErrorMessage(err);
      const raw = err instanceof Error ? err.message : String(err ?? '');

      if (mode === 'login' && /invalid|credential|wrong/i.test(raw)) {
        setError('Invalid credentials.');
      } else if (mode === 'register' && /already|exist/i.test(raw)) {
        setError("This email is already in use.");
      } else {
        setError(userMessage);
      }

      logError(err, 'login.handleSubmit');
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1400px] overflow-hidden rounded-2xl border border-[#dde0ea] bg-[#f8f8fb] md:min-h-[calc(100vh-3rem)]">
      {/* Left Side: Branding/Visuals */}
      <section className="relative hidden w-[50%] items-center justify-center overflow-hidden bg-[url('/backdrop_login.jpg')] bg-cover bg-center p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[#253a9c]/60" />

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm">
            Digital Atelier
          </p>
          <h1 className="mt-7 text-5xl font-semibold leading-tight">
            Elevating the Art of Inventory.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/85">
            Experience a Michelin-starred approach to resource management. Curate your kitchen with surgical precision.
          </p>

          <div className="mt-10 grid w-full grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-sm">
              <p className="text-sm font-semibold">Real-time</p>
              <p className="mt-1 text-sm text-white/80">Instant asset valuation and tracking.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-sm">
              <p className="text-sm font-semibold">Smart Alerts</p>
              <p className="mt-1 text-sm text-white/80">Predictive expiration intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Form */}
      <section className="flex w-full items-center justify-center p-6 md:p-10 lg:w-[50%]">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3345b8] hover:opacity-85">
              <ArrowLeft size={16} />
              FoodSystem
            </Link>
            <p className="text-xs text-[#949aab]">Secure Access</p>
          </div>

          <div className="mx-auto mb-8 inline-flex rounded-full bg-[#eceef4] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-white text-[#3345b8] shadow-sm" : "text-[#666d82]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
                mode === "register" ? "bg-white text-[#3345b8] shadow-sm" : "text-[#666d82]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-4xl font-semibold text-[#1f222b]">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-base text-[#6d7385]">
            {mode === "login" ? "Access your culinary dashboard." : "Join your inventory workspace."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f8596]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="chef@foodsystem.com"
                className="w-full border-b border-[#c8cddd] bg-transparent pb-3 text-base text-[#232731] placeholder:text-[#b0b5c2] focus:border-[#3345b8] focus:outline-none"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f8596]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full border-b border-[#c8cddd] bg-transparent pb-3 pr-10 text-base text-[#232731] placeholder:text-[#b0b5c2] focus:border-[#3345b8] focus:outline-none"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#7f8596] transition-colors hover:text-[#3345b8]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7f8596]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full border-b border-[#c8cddd] bg-transparent pb-3 pr-10 text-base text-[#232731] placeholder:text-[#b0b5c2] focus:border-[#3345b8] focus:outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#7f8596] transition-colors hover:text-[#3345b8]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm font-semibold text-[#b13535]">{error}</p>}
            {success && <p className="text-sm font-semibold text-[#2f8f5a]">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3345b8] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? "Enter Workspace" : "Create Account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] p-4 md:p-6">
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <AuthContent />
      </Suspense>
    </main>
  );
}