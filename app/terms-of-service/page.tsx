import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-4 py-10 text-[#151a23] md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[900px] rounded-2xl border border-[#e4e8f3] bg-white p-6 shadow-[0_8px_26px_rgba(15,22,40,0.06)] md:p-8">
        <h1 className="text-3xl font-semibold text-[#3345b8]">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-[#5e667a]">
          FoodSystem is provided as an open-source project. By using the software, you accept the terms below.
        </p>

        <section className="mt-6 space-y-3 text-sm leading-7 text-[#2b3140]">
          <p>
            The software is provided on an &quot;as is&quot; basis, without guarantees of uninterrupted service, data integrity,
            or fitness for a specific purpose.
          </p>
          <p>
            You are responsible for deployment, infrastructure, user management, and data handling decisions in your
            own environment.
          </p>
          <p>
            You must follow the project license terms and any third-party licenses used by dependencies.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-[#1d2330]">Usage Rules</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#2b3140]">
            <li>Do not use the software for unlawful activities.</li>
            <li>Do not claim ownership of open-source contributions made by others.</li>
            <li>Review and apply security best practices before production usage.</li>
          </ul>
        </section>

        <div className="mt-8 text-sm text-[#5e667a]">
          For legal or project clarifications, use the GitHub contact points listed on the Contact page.
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm font-semibold text-[#3345b8] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
