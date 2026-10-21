import type { HeaderContent, SiteSettings } from "@/content/types";
import { fill, telHref } from "@/content/tokens";
import { CallButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

/** Main header: 64px on mobile (logo + square call button), 84px on desktop. */
export function Header({ content, settings }: { content: HeaderContent; settings: SiteSettings }) {
  const tel = telHref(settings.phone);
  return (
    <header id="site-header" className="on-dark bg-forest-900">
      <div className="container-page flex h-16 items-center justify-between gap-3 lg:h-[84px] lg:gap-8">
        <Logo name={settings.companyName} tagline={fill(content.tagline, settings)} className="min-w-0" />

        <nav aria-label="Menu główne" className="hidden lg:block">
          <ul className="flex gap-9 text-base font-semibold">
            {content.nav.map((item) => (
              <li key={item.href + item.label}>
                <a href={item.href} className="inline-flex min-h-12 items-center text-white no-underline hover:text-beige-200">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden flex-col items-end leading-[1.15] md:flex">
            <span className="text-xs text-beige-200">{settings.hoursText}</span>
            <a href={tel} data-call="header" className="text-xl font-extrabold text-white no-underline hover:text-beige-200">
              {settings.phone}
            </a>
          </div>
          <CallButton
            href={tel}
            track="header"
            iconSize={20}
            className="hidden h-[52px] rounded-[10px] px-[22px] text-base md:inline-flex"
          >
            {content.callLabel}
          </CallButton>
          <a
            href={tel}
            data-call="header"
            aria-label={fill(content.callAriaLabel, settings)}
            className="flex size-12 items-center justify-center rounded-[10px] bg-accent text-ink md:hidden"
          >
            <Icon name="phone" size={22} strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </header>
  );
}
