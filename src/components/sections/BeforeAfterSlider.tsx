"use client";

import { useRef, useState } from "react";
import type { GalleryItem } from "@/content/types";
import { Photo } from "@/components/ui/Photo";
import { track } from "@/lib/analytics";

/**
 * Two stacked images; the "before" layer is clipped to the slider position.
 * A native (invisible) range input gives keyboard + screen-reader support;
 * pointer drag / tap anywhere on the image moves the line. touch-action: pan-y
 * keeps vertical page scrolling working on phones.
 */
export function BeforeAfterSlider({
  item,
  beforeLabel,
  afterLabel,
  ariaLabel,
}: {
  item: GalleryItem;
  beforeLabel: string;
  afterLabel: string;
  ariaLabel: string;
}) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const reported = useRef(false);

  const update = (value: number) => {
    setPos(Math.min(100, Math.max(0, value)));
    if (!reported.current) {
      reported.current = true;
      track("gallery_slider_used", { item: item.title });
    }
  };

  const fromPointer = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    update(((clientX - rect.left) / rect.width) * 100);
  };

  return (
    <div
      ref={box}
      className="relative h-[300px] cursor-ew-resize touch-pan-y overflow-hidden rounded-[14px] select-none md:h-[420px] lg:h-[520px] lg:rounded-[16px]"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">
        <Photo
          value={item.after}
          tone="after"
          sizes="(min-width: 1024px) 728px, 100vw"
          placeholderClassName="px-10 lg:items-end lg:px-[60px]"
          labelClassName="text-sm lg:max-w-[240px] lg:text-base"
        />
      </div>
      <Tag side="right" tone="after">{afterLabel}</Tag>

      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Photo
          value={item.before}
          tone="before"
          sizes="(min-width: 1024px) 728px, 100vw"
          placeholderClassName="px-10 lg:items-start lg:px-[60px] lg:text-left"
          labelClassName="text-sm lg:max-w-[240px] lg:text-base"
        />
        <Tag side="left" tone="before">{beforeLabel}</Tag>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pos)}
        onChange={(e) => update(Number(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={`${Math.round(pos)}%`}
        className="peer pointer-events-none absolute inset-0 m-0 h-full w-full opacity-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -ml-0.5 w-1 bg-white"
        style={{ left: `${pos}%` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -mt-6 -ml-6 flex size-12 items-center justify-center rounded-full bg-white text-forest-800 shadow-handle peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-800 peer-focus-visible:outline-solid lg:-mt-7 lg:-ml-7 lg:size-14"
        style={{ left: `${pos}%` }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-6 lg:size-7">
          <polyline points="9 6 3 12 9 18" />
          <polyline points="15 6 21 12 15 18" />
        </svg>
      </div>
    </div>
  );
}

export function Tag({
  children,
  side,
  tone,
  small = false,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  tone: "before" | "after";
  small?: boolean;
}) {
  const pos = small ? "top-2 left-2" : side === "left" ? "top-3 left-3 lg:top-4 lg:left-4" : "top-3 right-3 lg:top-4 lg:right-4";
  const size = small ? "rounded-[5px] px-2 py-[3px] text-[11px]" : "rounded-[6px] px-2.5 py-[5px] text-xs lg:px-3 lg:py-1.5 lg:text-[13px]";
  return (
    <span
      className={`absolute z-[1] font-extrabold text-white ${pos} ${size} ${tone === "before" ? "bg-ink-3" : "bg-forest-800"}`}
    >
      {children}
    </span>
  );
}
