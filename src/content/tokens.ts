import type { SiteSettings } from "./types";

/** Token name -> value, used by `fill()`. Keep in sync with the Studio field descriptions. */
export function tokenValues(s: SiteSettings): Record<string, string> {
  return {
    firma: s.companyName,
    rok: s.foundingYear,
    rok_biezacy: String(new Date().getFullYear()),
    miasto: s.city,
    telefon: s.phone,
    email: s.email,
    adres: s.address,
    nip: s.nip,
    godziny: s.hoursText,
    godzina_zamkniecia: s.closingHourText,
    promien: s.radiusKm,
    termin_oddzwonienia: s.callbackPromise,
  };
}

function capitalize(value: string) {
  // "[tego samego…]" -> "[Tego samego…]"
  return value.replace(/^(\[?)(\p{L})/u, (_, b: string, c: string) => b + c.toUpperCase());
}

/** Replaces {token} placeholders. Unknown tokens are left as-is; `extra` overrides. */
export function fill(text: string, s: SiteSettings, extra: Record<string, string> = {}): string {
  if (!text) return "";
  const values = { ...tokenValues(s), ...extra };
  return text.replace(/\{([A-Za-z_]+)\}/g, (match, name: string) => {
    const key = name.toLowerCase();
    if (!(key in values)) return match;
    const value = values[key];
    return name[0] !== name[0].toLowerCase() ? capitalize(value) : value;
  });
}

/** "600 000 000" -> "+48600000000" (9-digit numbers are treated as Polish). */
export function telHref(phone: string): string {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (!digits.startsWith("+")) digits = digits.length === 9 ? "+48" + digits : "+" + digits;
  return "tel:" + digits;
}

export function mailHref(email: string): string {
  return "mailto:" + email.replace(/[[\]\s]/g, "");
}

/** Polish plural form: 1 -> one, 2–4 (not 12–14) -> few, else many. */
export function plural<T>(n: number, one: T, few: T, many: T): T {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
