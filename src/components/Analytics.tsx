"use client";

import { useEffect } from "react";
import { initAnalytics, track } from "@/lib/analytics";

/**
 * Starts PostHog and tracks CTA clicks by delegation, so server components only
 * need data attributes: data-call="hero" on tel: links, data-photo-cta="hero"
 * on links to the form.
 */
export function Analytics() {
  useEffect(() => {
    initAnalytics();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-call],[data-photo-cta]");
      if (!el) return;
      const call = el.getAttribute("data-call");
      if (call) track("call_click", { location: call });
      const photo = el.getAttribute("data-photo-cta");
      if (photo) track("photo_cta_click", { location: photo });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
