import { Footer } from "@/components/sections/Footer";
import { Gallery } from "@/components/sections/Gallery";
import { Header } from "@/components/sections/Header";
import { Hero, TrustRow } from "@/components/sections/Hero";
import { Pricing } from "@/components/sections/Pricing";
import { QuoteForm } from "@/components/sections/QuoteForm";
import { Services } from "@/components/sections/Services";
import { StickyBar, StickyHeader } from "@/components/sections/StickyContact";
import { getContent } from "@/content/fetch";
import { fill } from "@/content/tokens";

export default async function Home() {
  const c = await getContent();
  const s = c.settings;
  return (
    <>
      <div id="top" />
      <StickyHeader content={c.header} settings={s} />
      <Header content={c.header} settings={s} />
      <main>
        <Hero content={c.hero} settings={s} />
        <TrustRow items={c.trust.items} />
        <Services content={c.services} settings={s} />
        <Gallery content={c.gallery} settings={s} />
        <Pricing content={c.pricing} settings={s} />
        <QuoteForm content={c.form} settings={s} />
      </main>
      <Footer content={c.footer} settings={s} tagline={fill(c.header.tagline, s)} />
      <StickyBar content={c.stickyBar} settings={s} />
    </>
  );
}
