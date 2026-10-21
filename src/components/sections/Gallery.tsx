"use client";

import { useState } from "react";
import type { GalleryContent, SiteSettings } from "@/content/types";
import { fill } from "@/content/tokens";
import { buttonStyles } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/Eyebrow";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { cx } from "@/components/ui/cx";
import { track } from "@/lib/analytics";
import { BeforeAfterSlider, Tag } from "./BeforeAfterSlider";

const PAIRS_SHOWN = 3;

export function Gallery({ content, settings }: { content: GalleryContent; settings: SiteSettings }) {
  const f = (t: string) => fill(t, settings);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const items = content.items.filter((it) => filter === "all" || it.category === filter);
  const [featured, ...rest] = items;
  const pairs = expanded ? rest : rest.slice(0, PAIRS_SHOWN);
  const hasMore = !expanded && rest.length > PAIRS_SHOWN;
  const showMore = hasMore || Boolean(content.moreUrl);

  const moreLabel = (
    <>
      <span className="lg:hidden">{f(content.moreLabelMobile)}</span>
      <span className="hidden lg:inline">{f(content.moreLabelDesktop)}</span>
      <Icon name="arrow-right" size={18} strokeWidth={2.2} />
    </>
  );
  const moreClass = cx(
    buttonStyles.base,
    buttonStyles.outline,
    "h-[52px] w-full gap-2 text-base lg:h-14 lg:w-auto lg:self-center lg:px-8 lg:text-[17px]",
  );

  return (
    <section id="realizacje" aria-labelledby="realizacje-heading" className="section-pad bg-white">
      <div className="container-page flex flex-col gap-5 lg:gap-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading
            id="realizacje-heading"
            eyebrow={f(content.eyebrow)}
            heading={f(content.heading)}
            lead={f(content.lead)}
            className="lg:max-w-[620px]"
          />
          <div
            role="group"
            aria-label={f(content.eyebrow)}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:-mx-8 md:px-8 lg:mx-0 lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0"
          >
            {content.filters.map((chip) => {
              const active = chip.value === filter;
              return (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(chip.value);
                    setExpanded(false);
                    track("gallery_filter", { filter: chip.value });
                  }}
                  className={cx(
                    "h-11 shrink-0 cursor-pointer rounded-full px-4 text-[15px] transition-colors lg:px-[18px]",
                    active
                      ? "border-0 bg-forest-800 font-bold text-white"
                      : "border-[1.5px] border-line-strong bg-white font-semibold text-ink hover:border-forest-800",
                  )}
                >
                  {f(chip.label)}
                </button>
              );
            })}
          </div>
        </div>

        <div aria-live="polite" className="sr-only">
          {items.length === 0 ? f(content.emptyText) : ""}
        </div>

        {featured ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,728fr)_minmax(0,512fr)] lg:items-start lg:gap-10">
            <figure className="m-0 flex flex-col gap-2.5 lg:gap-3.5">
              <BeforeAfterSlider
                key={featured.title + filter}
                item={featured}
                beforeLabel={f(content.beforeLabel)}
                afterLabel={f(content.afterLabel)}
                ariaLabel={f(content.sliderAriaLabel)}
              />
              <figcaption className="flex flex-col gap-0.5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
                <span className="text-base font-extrabold text-forest-900 lg:text-[19px]">{f(featured.title)}</span>
                <span className="text-sm text-ink-3 lg:text-[15px]">
                  {f(featured.location)} · {f(featured.detail)} ·{" "}
                  <span className="lg:hidden">{f(content.sliderHintMobile)}</span>
                  <span className="hidden lg:inline">{f(content.sliderHintDesktop)}</span>
                </span>
              </figcaption>
            </figure>

            {pairs.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-5 border-t border-line p-0 pt-5 md:grid md:grid-cols-2 lg:flex lg:gap-[22px] lg:border-0 lg:pt-0">
                {pairs.map((it, i) => (
                  <li key={it.title + i}>
                    <article className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="relative h-[140px] overflow-hidden rounded-l-[10px] lg:h-32">
                          <Photo
                            value={it.before}
                            tone="before"
                            sizes="(min-width: 1024px) 250px, 50vw"
                            placeholderClassName="px-2.5 lg:px-3"
                            labelClassName="text-xs lg:text-[13px]"
                          />
                          <Tag side="left" tone="before" small>{f(content.beforeLabel)}</Tag>
                        </div>
                        <div className="relative h-[140px] overflow-hidden rounded-r-[10px] lg:h-32">
                          <Photo
                            value={it.after}
                            tone="after"
                            sizes="(min-width: 1024px) 250px, 50vw"
                            placeholderClassName="px-2.5 lg:px-3"
                            labelClassName="text-xs lg:text-[13px]"
                          />
                          <Tag side="left" tone="after" small>{f(content.afterLabel)}</Tag>
                        </div>
                      </div>
                      <h3 className="m-0 text-[15px] text-forest-900 lg:text-base">{f(it.title)}</h3>
                      <p className="m-0 -mt-1.5 text-[13px] text-ink-3 lg:text-sm">
                        {f(it.location)} · {f(it.detail)}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="m-0 rounded-[14px] bg-beige-50 p-6 text-base text-ink-2">{f(content.emptyText)}</p>
        )}

        {showMore &&
          (hasMore ? (
            <button type="button" onClick={() => setExpanded(true)} className={cx(moreClass, "cursor-pointer")}>
              {moreLabel}
            </button>
          ) : (
            <a href={content.moreUrl} target="_blank" rel="noopener" className={moreClass}>
              {moreLabel}
            </a>
          ))}
      </div>
    </section>
  );
}
