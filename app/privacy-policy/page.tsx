import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f8] px-4 py-10 text-[#151a23] md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[900px] rounded-2xl border border-[#e4e8f3] bg-white p-6 shadow-[0_8px_26px_rgba(15,22,40,0.06)] md:p-8">
        <h1 className="text-3xl font-semibold text-[#3345b8]">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-[#5e667a]">
          FoodSystem is an open-source project. Data management choices belong to each user and each deployment owner.
        </p>

        <section className="mt-6 space-y-3 text-sm leading-7 text-[#2b3140]">
          <p>
            We do not impose a centralized data retention model. If you self-host this application, you are responsible
            for choosing how data is stored, secured, backed up, and deleted.
          </p>
          <p>
            If you use third-party services (hosting, authentication, database, analytics), their privacy policies also
            apply and should be reviewed independently.
          </p>
          <p>
            As an open-source codebase, transparency is provided through the public source code and documentation.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-[#1d2330]">Your Responsibility</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#2b3140]">
            <li>Choose your own data storage and security strategy.</li>
            <li>Configure user permissions according to your environment.</li>
            <li>Comply with local regulations applicable to your usage.</li>
          </ul>
        </section>

        <div className="mt-8 text-sm text-[#5e667a]">
          Questions about privacy practices can be addressed through GitHub channels listed on the Contact page.
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
