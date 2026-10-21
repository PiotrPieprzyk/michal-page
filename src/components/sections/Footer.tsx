import type { FooterContent, SiteSettings } from "@/content/types";
import { fill, mailHref, telHref } from "@/content/tokens";
import { CallButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const label = "m-0 text-xs font-bold tracking-[0.08em] text-on-dark-muted uppercase";
const link = "text-beige-200 hover:text-white";

export function Footer({
  content,
  settings,
  tagline,
}: {
  content: FooterContent;
  settings: SiteSettings;
  tagline: string;
}) {
  const f = (t: string) => fill(t, settings);
  const tel = telHref(settings.phone);
  const area = f(content.areaLine);

  return (
    <footer id="kontakt" className="on-dark bg-forest-900 text-white">
      {/* Desktop call strip */}
      <div className="hidden bg-forest-800 lg:block">
        <div className="container-page flex items-center justify-between gap-10 py-8">
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[26px] font-extrabold">{f(content.ctaTitle)}</p>
            <p className="m-0 text-base text-on-green">{f(content.ctaText)}</p>
          </div>
          <CallButton href={tel} track="footer" className="h-[60px] px-7 text-xl">
            {settings.phone}
          </CallButton>
        </div>
      </div>

      <div className="container-page flex flex-col gap-7 pt-10 pb-[104px] md:pb-10 lg:pb-0">
        <div className="flex flex-col gap-7 lg:grid lg:grid-cols-4 lg:gap-12 lg:pt-2 lg:pb-8">
          <div className="flex flex-col gap-3 lg:gap-3.5">
            <Logo name={settings.companyName} tagline={tagline} as="div" />
            <p className="m-0 text-[15px] leading-normal text-on-dark lg:leading-[1.55]">{f(content.description)}</p>
          </div>

          {/* Mobile: phone in a green box */}
          <div className="flex flex-col gap-3 rounded-[14px] bg-forest-800 px-4 py-[18px] lg:hidden">
            <span className="text-[13px] font-semibold text-beige-200">{f(content.phoneLabelMobile)}</span>
            <a href={tel} data-call="footer" className="text-[30px] font-extrabold text-white no-underline">
              {settings.phone}
            </a>
            <CallButton href={tel} track="footer" iconSize={20} className="h-14 text-[17px]">
              {f(content.callLabel)}
            </CallButton>
          </div>

          {/* Mobile: contact details list */}
          <dl className="m-0 grid gap-3.5 text-[15px] leading-[1.45] lg:hidden">
            <div className="flex flex-col gap-0.5">
              <dt className={label}>{f(content.emailLabel)}</dt>
              <dd className="m-0">
                <a href={mailHref(settings.email)} className={link}>{settings.email}</a>
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className={label}>{f(content.addressLabel)}</dt>
              <dd className="m-0">{settings.address}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className={label}>{f(content.hoursLabel)}</dt>
              <dd className="m-0">
                {settings.hoursText} · {f(content.hoursExtra)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className={label}>{f(content.areaHeading)}</dt>
              <dd className="m-0">
                {area}
                {settings.areaServed.length > 0 && `: ${settings.areaServed.join(", ")}`}
              </dd>
            </div>
          </dl>

          {/* Desktop columns */}
          <div className="hidden flex-col gap-3 text-[15px] leading-normal lg:flex">
            <h2 className={label}>{f(content.contactHeading)}</h2>
            <a href={tel} data-call="footer" className="text-[22px] font-extrabold text-white no-underline">
              {settings.phone}
            </a>
            <a href={mailHref(settings.email)} className={link}>{settings.email}</a>
            <address className="text-on-dark not-italic">{settings.address}</address>
            <span className="text-on-dark">
              {settings.hoursText}
              <br />
              {f(content.hoursExtra)}
            </span>
          </div>

          <div className="hidden flex-col gap-3 text-[15px] leading-normal lg:flex">
            <h2 className={label}>{f(content.areaHeading)}</h2>
            <span className="text-on-dark">{area}</span>
            <span className="text-on-dark">{settings.areaServed.join(" · ")}</span>
          </div>

          <nav aria-labelledby="footer-nav-heading" className="border-t border-forest-700 pt-2 lg:border-0 lg:pt-0">
            <h2 id="footer-nav-heading" className={`${label} sr-only lg:not-sr-only lg:mb-2`}>
              {f(content.navHeading)}
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-4 p-0 text-base font-semibold lg:flex lg:flex-col lg:gap-1">
              {content.nav.map((item) => (
                <li key={item.href + item.label}>
                  <a href={item.href} className={`flex min-h-11 items-center no-underline lg:min-h-9 ${link}`}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-forest-700 pt-4 text-[13px] text-on-dark-muted lg:flex-row lg:justify-between lg:pt-5 lg:pb-7">
          <span>{f(content.copyright)}</span>
          <a href="/polityka-prywatnosci/" className={`inline-flex min-h-11 items-center lg:min-h-0 ${link}`}>
            {f(content.privacyLabel)}
          </a>
        </div>
      </div>
    </footer>
  );
}
