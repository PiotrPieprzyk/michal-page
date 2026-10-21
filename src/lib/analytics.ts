"use client";

import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let started = false;

/**
 * PostHog Cloud EU without cookies or localStorage (persistence: "memory"),
 * so no consent banner is needed. Session replay stays off.
 */
export function initAnalytics() {
  if (started || !key || typeof window === "undefined") return;
  started = true;
  posthog.init(key, {
    api_host: host,
    persistence: "memory",
    person_profiles: "never",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    disable_surveys: true,
    capture_exceptions: true,
  });
}

export type AnalyticsEvent =
  | "call_click"
  | "photo_cta_click"
  | "form_started"
  | "form_upload_error"
  | "form_submitted"
  | "gallery_filter"
  | "gallery_slider_used";

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (!started) return;
  try {
    posthog.capture(event, props);
  } catch {
    // analytics must never break the page
  }
}
