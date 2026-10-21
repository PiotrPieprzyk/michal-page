import type { ServicesContent, SiteSettings } from "@/content/types";
import { fill, telHref } from "@/content/tokens";
import { ArrowLink, CallButton } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";

export function Services({ content, settings }: { content: ServicesContent; settings: SiteSettings }) {
  const f = (t: string) => fill(t, settings);
  const tel = telHref(settings.phone);
  return (
    <section id="uslugi" aria-labelledby="uslugi-heading" className="section-pad bg-beige-100">
      <div className="container-page flex flex-col gap-3 lg:gap-10">
        <div className="mb-3 flex flex-col gap-4 lg:mb-0 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading
            id="uslugi-heading"
            eyebrow={f(content.eyebrow)}
            heading={f(content.heading)}
            lead={f(content.lead)}
            className="lg:max-w-[640px]"
          />
          <ArrowLink href="#cennik" className="hidden text-[17px] no-underline lg:inline-flex">
            {f(content.pricingLinkLabel)}
          </ArrowLink>
        </div>

        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {content.cards.map((card, i) => (
            <li key={i}>
              <article className="flex h-full gap-3.5 rounded-[14px] border border-line bg-white p-3 md:flex-col md:gap-0 md:overflow-hidden md:rounded-[16px] md:p-0">
                <div className="relative h-[108px] w-[92px] shrink-0 overflow-hidden rounded-[10px] md:h-[210px] md:w-full md:rounded-none">
                  <Photo
                    value={card.image}
                    sizes="(min-width: 1024px) 410px, (min-width: 768px) 50vw, 92px"
                    placeholderClassName="px-1.5 md:px-8"
                    labelClassName="text-[11px] font-bold md:text-sm md:font-semibold"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 md:gap-2.5 md:px-6 md:pt-[22px] md:pb-[26px]">
                  <h3 className="m-0 flex items-center gap-2 text-[17px] text-forest-900 md:gap-2.5 md:text-[21px]">
                    <Icon name={card.icon} size={24} className="size-5 shrink-0 text-forest-800 md:size-6" />
                    {f(card.title)}
                  </h3>
                  <p className="m-0 text-sm leading-[1.45] text-ink-2 md:text-base md:leading-normal">{f(card.text)}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {/* Mobile: permits note + CTA box */}
        <p className="m-0 flex items-start gap-3 px-1 py-3.5 text-sm leading-[1.45] text-ink-2 lg:hidden">
          <Icon name="file-text" size={22} className="shrink-0 text-forest-800" />
          <span>
            <strong className="text-forest-900">{f(content.permitsStrong)}</strong> {f(content.permitsText)}
          </span>
        </p>
        <div className="on-dark mt-1 flex flex-col gap-3 rounded-[16px] bg-forest-800 px-[18px] py-[22px] text-white lg:hidden">
          <h3 className="m-0 text-[22px] leading-[1.2]">{f(content.ctaMobileTitle)}</h3>
          <p className="m-0 text-[15px] leading-normal text-on-green">{f(content.ctaMobileText)}</p>
          <CallButton href={tel} track="services_cta" className="h-14 text-lg">
            {f(content.ctaCallLabel)}
          </CallButton>
        </div>

        {/* Desktop: horizontal strip */}
        <div className="on-dark hidden items-center justify-between gap-10 rounded-[18px] bg-forest-800 px-9 py-7 text-white lg:flex">
          <div className="flex items-center gap-[18px]">
            <Icon name="file-text" size={36} strokeWidth={1.8} className="shrink-0 text-beige-200" />
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[22px]">{f(content.ctaDesktopTitle)}</h3>
              <p className="m-0 text-base text-on-green">{f(content.ctaDesktopText)}</p>
            </div>
          </div>
          <CallButton href={tel} track="services_cta" className="h-[60px] shrink-0 px-7 text-[19px]">
            {f(content.ctaCallLabel)}
          </CallButton>
        </div>
      </div>
    </section>
  );
}
