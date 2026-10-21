import type { SiteSettings } from "@/content/types";

const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Is the business answering the phone right now (Polish time)? */
export function isOpenNow(s: SiteSettings, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = DAY_CODES.find((code) => get("weekday").startsWith(code)) ?? "";
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return s.openingDays.includes(day) && minutes >= toMin(s.opensAt) && minutes < toMin(s.closesAt);
}
