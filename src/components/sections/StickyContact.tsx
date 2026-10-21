"use client";

import { useEffect, useState } from "react";
import type { HeaderContent, SiteSettings, StickyBarContent } from "@/content/types";
import { fill, telHref } from "@/content/tokens";
import { buttonStyles, CallButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/components/ui/cx";
import { isOpenNow } from "@/lib/hours";

/** true once `id` has scrolled out of the viewport (IntersectionObserver). */
function useScrolledPast(id: string) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return past;
}

function useOpenNow(settings: SiteSettings) {
  // Static HTML assumes "open"; corrected after hydration.
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow(settings));
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => window.clearInterval(t);
  }, [settings]);
  return open;
}

const slide = "transition-transform duration-200 ease-out motion-reduce:transition-none";

/** Mobile (< 768px) bottom bar; appears once the hero call button leaves the screen. */
export function StickyBar({ content, settings }: { content: StickyBarContent; settings: SiteSettings }) {
  const visible = useScrolledPast("hero-call");
  const open = useOpenNow(settings);
  const offHours = content.swapOffHours && !open;
  const tel = telHref(settings.phone);

  const call = (
    <CallButton
      href={tel}
      track="sticky_bar"
      iconSize={20}
      className={cx("h-14 basis-0 text-[17px]", offHours ? "flex-1" : "flex-[1.7]")}
    >
      {settings.phone}
    </CallButton>
  );
  const photo = (
    <a
      href="#formularz"
      data-photo-cta="sticky_bar"
      className={cx(
        buttonStyles.base,
        "h-14 basis-0 gap-2 text-[15px]",
        offHours ? "flex-[1.7] bg-forest-800 font-extrabold text-white" : "flex-1 bg-forest-800 font-bold text-white",
      )}
    >
      <Icon name="camera" size={20} />
      {fill(content.photoLabel, settings)}
    </a>
  );

  return (
    <nav
      aria-label={fill(content.ariaLabel, settings)}
      aria-hidden={!visible}
      inert={!visible}
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2 border-t border-line bg-white px-3 pt-2 shadow-bar md:hidden",
        "pb-[max(20px,env(safe-area-inset-bottom))]",
        slide,
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <p className="m-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-2">
        {!offHours && <span className="size-2 rounded-full bg-success" aria-hidden="true" />}
        {fill(offHours ? content.offlineLine : content.onlineLine, settings)}
      </p>
      <div className="flex gap-2">
        {offHours ? (
          <>
            {photo}
            {call}
          </>
        ) : (
          <>
            {call}
            {photo}
          </>
        )}
      </div>
    </nav>
  );
}

/** Desktop (≥ 768px) compact white header shown once the main header scrolls away. */
export function StickyHeader({ content, settings }: { content: HeaderContent; settings: SiteSettings }) {
  const visible = useScrolledPast("site-header");
  const open = useOpenNow(settings);
  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cx(
        "fixed inset-x-0 top-0 z-40 hidden border-b border-line bg-white shadow-header md:block",
        slide,
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-8">
        <Logo name={settings.companyName} variant="light" />
        <nav aria-label="Menu" className="hidden lg:block">
          <ul className="flex gap-8 text-[15px] font-semibold">
            {content.stickyNav.map((item) => (
              <li key={item.href + item.label}>
                <a href={item.href} className="inline-flex min-h-12 items-center text-ink no-underline hover:text-forest-800">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          {open && (
            <span className="hidden items-center gap-1.5 text-[13px] font-semibold text-ink-2 lg:flex">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              {fill(content.stickyStatus, settings)}
            </span>
          )}
          <CallButton href={telHref(settings.phone)} track="sticky_header" iconSize={18} className="h-12 rounded-[10px] px-5 text-[17px]">
            {settings.phone}
          </CallButton>
        </div>
      </div>
    </div>
  );
}
