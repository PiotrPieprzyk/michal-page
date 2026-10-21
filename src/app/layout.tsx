import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { getContent } from "@/content/fetch";
import { fill, mailHref, telHref } from "@/content/tokens";
import { hasImage, imageUrl } from "@/lib/sanity-image";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-archivo",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#14291D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getContent();
  const title = fill(s.seoTitle, s);
  const description = fill(s.seoDescription, s);
  const og = hasImage(s.ogImage) ? imageUrl(s.ogImage, 1200, 630) : undefined;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url: "/",
      siteName: s.companyName,
      title,
      description,
      images: og ? [{ url: og, width: 1200, height: 630 }] : undefined,
    },
    formatDetection: { telephone: false },
  };
}

const clean = (v: string) => v.replace(/[[\]]/g, "");

async function LocalBusinessJsonLd() {
  const { settings: s, hero } = await getContent();
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#business`,
    name: clean(s.companyName),
    description: fill(s.seoDescription, s),
    url: siteUrl,
    telephone: telHref(s.phone).replace("tel:", ""),
    email: clean(mailHref(s.email).replace("mailto:", "")),
    address: { "@type": "PostalAddress", streetAddress: clean(s.address), addressCountry: "PL" },
    areaServed: [clean(s.city), ...s.areaServed.map(clean)].map((name) => ({ "@type": "City", name })),
    openingHours: `${s.openingDays.join(",")} ${s.opensAt}-${s.closesAt}`,
    foundingDate: clean(s.foundingYear),
    taxID: clean(s.nip),
    image: hasImage(hero.image.image) ? imageUrl(hero.image.image, 1200) : undefined,
    priceRange: "$$",
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={archivo.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
        <LocalBusinessJsonLd />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
