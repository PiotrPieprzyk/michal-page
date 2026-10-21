import type { HeroContent, SiteSettings, TrustItem } from "@/content/types";
import { fill, telHref } from "@/content/tokens";
import { buttonStyles, CallButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MultiLine } from "@/components/ui/MultiLine";
import { Photo } from "@/components/ui/Photo";
import { cx } from "@/components/ui/cx";

/** Hero A "Ekipa w akcji": photo + green panel. The phone number is visible at every breakpoint. */
export function Hero({ content, settings }: { content: HeroContent; settings: SiteSettings }) {
  const tel = telHref(settings.phone);
  const f = (t: string) => fill(t, settings);
  return (
    <div className="flex flex-col lg:min-h-[616px] lg:flex-row">
      {/* Photo: on top on mobile, right column on desktop */}
      <div className="relative h-[290px] lg:order-last lg:h-auto lg:flex-1">
        <Photo
          value={content.image}
          preload
          sizes="(min-width: 1024px) calc(100vw - 640px), 100vw"
          withIcon
          placeholderClassName="px-8 lg:px-20"
          labelClassName="text-sm lg:max-w-[460px] lg:text-[17px]"
        />
        <Badge value={content.badgeValue} label={content.badgeLabel} />
      </div>

      <section
        aria-labelledby="hero-heading"
        className="on-dark flex flex-col gap-4 bg-forest-800 px-4 pt-10 pb-7 text-white md:px-8 lg:w-[max(640px,calc(50vw-80px))] lg:shrink-0 lg:justify-center lg:gap-[22px] lg:pt-[72px] lg:pr-16 lg:pb-16 lg:pl-[max(80px,calc(50vw-640px))]"
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-beige-200 lg:text-sm lg:tracking-[0.1em]">
          {f(content.eyebrow)}
        </span>
        <h1
          id="hero-heading"
          className="m-0 max-w-[560px] text-[34px] leading-[1.08] tracking-[-0.01em] lg:text-[56px] lg:leading-[1.04] lg:tracking-[-0.02em]"
        >
          {f(content.heading)}
        </h1>
        <p className="m-0 max-w-[480px] text-[17px] leading-normal text-on-green lg:text-[19px] lg:leading-[1.55]">
          {f(content.lead)}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-2.5 lg:gap-3.5">
          <CallButton
            id="hero-call"
            href={tel}
            track="hero"
            className="h-[60px] px-7 text-xl lg:h-[62px]"
          >
            <span className="lg:hidden">{f(content.callLabelMobile)}</span>
            <span className="hidden lg:inline">{f(content.callLabelDesktop)}</span>
          </CallButton>
          <a
            href="#formularz"
            data-photo-cta="hero"
            className={cx(buttonStyles.base, buttonStyles.outlineDark, "h-14 gap-2.5 px-6 text-base lg:h-[62px] lg:text-[17px]")}
          >
            <Icon name="camera" size={20} />
            <span className="lg:hidden">{f(content.photoCtaMobile)}</span>
            <span className="hidden lg:inline">{f(content.photoCtaDesktop)}</span>
          </a>
        </div>
        <p className="m-0 flex items-center gap-2 text-sm text-beige-200 lg:hidden">
          <Icon name="clock" size={16} />
          {f(content.hoursLine)}
        </p>
      </section>
    </div>
  );
}

function Badge({ value, label }: { value: string; label: string }) {
  return (
    <div className="absolute bottom-[-18px] left-4 z-10 flex items-center gap-2 rounded-[10px] bg-beige-200 px-3.5 py-2.5 text-forest-900 shadow-badge lg:bottom-12 lg:left-[-40px] lg:gap-3 lg:rounded-[12px] lg:px-[22px] lg:py-4">
      <span className="text-[26px] leading-none font-extrabold lg:text-[44px]">{value}</span>
      <span className="text-xs leading-[1.15] font-semibold lg:text-[15px] lg:leading-[1.2] lg:font-bold">
        <MultiLine text={label} />
      </span>
    </div>
  );
}

/** Trust row under the hero: 3 columns (icon above text) on mobile, 4 in a row on desktop. */
export function TrustRow({ items }: { items: TrustItem[] }) {
  return (
    <div className="border-line bg-beige-100 lg:border-b">
      <ul className="container-page grid grid-cols-3 gap-2 pt-6 pb-6 lg:min-h-[120px] lg:grid-cols-4 lg:items-center lg:gap-6 lg:py-6">
        {items.map((item, i) => (
          <li
            key={i}
            className={cx(
              "flex flex-col items-center gap-2 text-center text-forest-800 lg:flex-row lg:gap-3 lg:text-left",
              item.hideOnMobile && "hidden lg:flex",
            )}
          >
            <Icon name={item.icon} size={28} className="shrink-0" />
            <span className="text-[13px] leading-[1.25] font-bold text-ink lg:text-base">
              <MultiLine text={item.label} mobileOnly />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
