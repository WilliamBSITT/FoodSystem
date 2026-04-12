import Link from "next/link";

export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-4 py-10 text-[#151a23] md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[900px] rounded-2xl border border-[#e4e8f3] bg-white p-6 shadow-[0_8px_26px_rgba(15,22,40,0.06)] md:p-8">
        <h1 className="text-3xl font-semibold text-[#3345b8]">Contact Us</h1>
        <p className="mt-4 text-sm leading-7 text-[#5e667a]">
          The primary contact channel for FoodSystem is GitHub.
        </p>

        <section className="mt-6 space-y-3 text-sm leading-7 text-[#2b3140]">
          <p>
            For questions, bug reports, feature requests, or collaboration, please use the maintainer’s GitHub profile
            and the repository issue tracker.
          </p>
          <p>
            All project-related information is publicly available on GitHub, including updates, source code,
            contribution flow, and discussions.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-[#e4e8f3] bg-[#f8f9fd] p-4 text-sm text-[#2b3140]">
          <p className="font-semibold text-[#1d2330]">Contact channels</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>GitHub profile of the project maintainer</li>
            <li>GitHub repository issues section</li>
            <li>GitHub discussions (if enabled)</li>
          </ul>
        </section>

        <div className="mt-8">
          <Link href="/" className="text-sm font-semibold text-[#3345b8] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
