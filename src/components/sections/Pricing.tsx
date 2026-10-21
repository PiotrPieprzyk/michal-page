import type { PricingContent, SiteSettings } from "@/content/types";
import { fill, telHref } from "@/content/tokens";
import { ArrowLink, CallButton } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { MultiLine } from "@/components/ui/MultiLine";
import { cx } from "@/components/ui/cx";

/** Real <table>: 2 columns on mobile (service + scope | price), 3 on desktop. */
export function Pricing({ content, settings }: { content: PricingContent; settings: SiteSettings }) {
  const f = (t: string) => fill(t, settings);
  const tel = telHref(settings.phone);

  return (
    <section id="cennik" aria-labelledby="cennik-heading" className="section-pad bg-beige-100">
      <div className="container-page flex flex-col gap-5 lg:gap-10">
        <SectionHeading
          id="cennik-heading"
          eyebrow={f(content.eyebrow)}
          heading={f(content.heading)}
          lead={f(content.lead)}
          className="lg:max-w-[680px]"
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-3.5 lg:gap-3">
            <div className="overflow-hidden rounded-[14px] border border-line bg-white lg:rounded-[16px]">
              <table className="w-full border-collapse text-[15px] lg:text-base">
                <caption className="bg-beige-50 px-4 py-3.5 text-left text-[13px] font-bold tracking-[0.06em] text-ink-3 uppercase lg:sr-only">
                  {f(content.captionMobile)}
                </caption>
                <thead className="hidden lg:table-header-group">
                  <tr className="bg-beige-50 text-left text-[13px] tracking-[0.06em] text-ink-3 uppercase">
                    <th scope="col" className="px-6 py-4 font-bold">{f(content.colService)}</th>
                    <th scope="col" className="px-6 py-4 font-bold">{f(content.colScope)}</th>
                    <th scope="col" className="px-6 py-4 text-right font-bold">{f(content.colPrice)}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.rows.map((row, i) => (
                    <tr key={i} className={cx(row.free && "bg-highlight")}>
                      <th
                        scope="row"
                        className="border-t border-track px-4 py-3.5 text-left align-top font-bold lg:px-6 lg:py-4 lg:align-middle"
                      >
                        {f(row.service)}
                        <span
                          className={cx(
                            "mt-0.5 block text-[13px] font-normal lg:hidden",
                            row.free ? "text-highlight-ink" : "text-ink-3",
                          )}
                        >
                          {f(row.scope)}
                        </span>
                      </th>
                      <td
                        className={cx(
                          "hidden border-t border-track px-6 py-4 lg:table-cell",
                          row.free ? "text-highlight-ink" : "text-ink-2",
                        )}
                      >
                        {f(row.scope)}
                      </td>
                      <td
                        className={cx(
                          "border-t border-track px-4 py-3.5 text-right align-top font-extrabold lg:px-6 lg:py-4 lg:align-middle lg:whitespace-nowrap",
                          row.free ? "text-forest-800" : "text-forest-900",
                          !row.priceMobile && "whitespace-nowrap",
                        )}
                      >
                        {row.priceMobile ? (
                          <>
                            <span className="lg:hidden">
                              <MultiLine text={f(row.priceMobile)} />
                            </span>
                            <span className="hidden lg:inline">{f(row.price)}</span>
                          </>
                        ) : (
                          f(row.price)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 mx-0.5 text-[13px] leading-normal text-ink-3 lg:mx-1 lg:text-sm">{f(content.vatNote)}</p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-white px-4 py-[18px] lg:gap-3.5 lg:rounded-[16px] lg:p-6">
              <h3 className="m-0 text-lg text-forest-900 lg:text-xl">{f(content.factorsTitle)}</h3>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] leading-[1.4] lg:gap-3 lg:text-base">
                {content.factors.map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Icon name="check" size={20} strokeWidth={2.4} className="shrink-0 text-forest-800" />
                    {f(item)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop: green CTA card */}
            <div className="on-dark hidden flex-col gap-3.5 rounded-[16px] bg-forest-800 p-6 text-white lg:flex">
              <h3 className="m-0 text-[22px] leading-[1.2]">{f(content.ctaCardTitle)}</h3>
              <p className="m-0 text-base leading-normal text-on-green">{f(content.ctaCardText)}</p>
              <CallButton href={tel} track="pricing" className="h-[58px] text-[19px]">
                {f(content.ctaCardCall)}
              </CallButton>
              <ArrowLink href="#formularz" data-photo-cta="pricing" className="justify-center text-base text-white hover:text-beige-200">
                {f(content.ctaCardLink)}
              </ArrowLink>
            </div>
          </div>

          {/* Mobile: call button + link to the form */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            <CallButton href={tel} track="pricing" className="h-14 text-lg">
              {f(content.ctaMobileCall)}
            </CallButton>
            <ArrowLink href="#formularz" data-photo-cta="pricing" className="justify-center text-base">
              {f(content.ctaMobileLink)}
            </ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}
