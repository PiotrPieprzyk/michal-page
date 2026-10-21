import type { Metadata } from "next";
import { getContent } from "@/content/fetch";
import { fill } from "@/content/tokens";
import { Logo } from "@/components/ui/Logo";

export async function generateMetadata(): Promise<Metadata> {
  const { privacy, settings } = await getContent();
  return {
    title: `${fill(privacy.title, settings)} — ${settings.companyName}`,
    alternates: { canonical: "/polityka-prywatnosci/" },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage() {
  const { privacy, settings: s, header } = await getContent();
  return (
    <>
      <header className="on-dark bg-forest-900">
        <div className="container-page flex h-16 items-center lg:h-[84px]">
          <Logo name={s.companyName} tagline={fill(header.tagline, s)} as="div" />
        </div>
      </header>
      <main className="container-page section-pad max-w-[860px] bg-beige-100">
        <a href="/" className="inline-flex min-h-12 items-center font-bold text-forest-800 underline">
          ← Strona główna
        </a>
        <h1 className="mt-4 mb-6 text-[30px] leading-[1.1] text-forest-900 lg:text-[48px]">{fill(privacy.title, s)}</h1>
        <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-2 lg:text-lg">
          {privacy.body.map((p, i) =>
            p.startsWith("## ") ? (
              <h2 key={i} className="mt-4 text-xl text-forest-900 lg:text-2xl">
                {fill(p.slice(3), s)}
              </h2>
            ) : (
              <p key={i} className="m-0">
                {fill(p, s)}
              </p>
            ),
          )}
        </div>
      </main>
    </>
  );
}
